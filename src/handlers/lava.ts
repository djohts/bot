import { TextChannel, VoiceBasedChannel, Message, Client } from "discord.js";
import { clientLogger } from "../util/logger/cluster";
import { getGuildDocument } from "../database";
import { Manager } from "erela.js";
import { inspect } from "util";
import config from "../constants/config";
import Spotify from "erela.js-spotify";
import Util from "../util/Util";

const { lava: { nodes, spotify: { clientId, clientSecret } } } = config;

export = (client: Client) => new Manager({
    nodes: nodes,
    plugins: [
        // @ts-ignore
        new Spotify({ clientID: clientId, clientSecret })
    ],
    send(id, payload) {
        client.guilds.cache.get(id)?.shard.send(payload);
    }
})
    .on("trackError", async (player, track, error) => {
        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        clientLogger.error(`[g${player.guild}] ${track.title} failed to play: ${inspect(error)}`);

        try {
            await text.send(`An error occured when trying to play \`${track.title}\`: ${error.error}`);
        } catch { };
    })
    .on("trackStuck", async (player, track, error) => {
        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        try {
            await text.send(`\`${track.title}\` got stuck.`);
        } catch { };
    })
    .on("nodeConnect", ({ options }) => clientLogger.info(`Lava ${options.host}:${options.port} connected.`))
    .on("nodeError", ({ options }, error) => clientLogger.error(`Lava ${options.host}:${options.port} had an error: ${error.message}`))
    .on("trackStart", async (player, track) => {
        const document = await getGuildDocument(player.guild);
        const _ = Util.i18n.getLocale(document.locale);

        const voice = client.channels.cache.get(player.voiceChannel) as VoiceBasedChannel;
        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        if (!voice?.members.filter((m) => m.user.id !== client.user.id).size) {
            try {
                let message = player.get<Message>("message");
                if (!message || !message.editable) await text.send({ content: _("handlers.lava.tmptyvc"), embeds: [] });
                else await message.edit({ content: _("handlers.lava.tmptyvc"), embeds: [] });
            } catch { };

            return player.destroy();
        };

        try {
            let message = player.get<Message<true>>("message");
            if (!message || !message.editable) {
                message = await text.send(_("handlers.lava.loading"));
                return player.set("message", message);
            };
        } catch { };
    })
    .on("queueEnd", async (player) => {
        const document = await getGuildDocument(player.guild);
        const _ = Util.i18n.getLocale(document.locale);

        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        try {
            let message = player.get<Message<true>>("message");
            if (!message || !message.editable) await text.send({ content: _("handlers.lava.emptyqueue"), embeds: [] });
            else await message.edit({ content: _("handlers.lava.emptyqueue"), embeds: [] });
        } catch { };

        return player.destroy();
    })
    .init(client.user.id);