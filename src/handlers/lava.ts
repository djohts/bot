import { TextChannel, VoiceBasedChannel, Message } from "discord.js";
import { ModifiedClient } from "../constants/types";
import { Manager } from "erela.js";
import Spotify from "better-erela.js-spotify";
import { splitBar } from "string-progressbar";
import config from "../../config";
const { lava: { nodes, spotify: { clientId, clientSecret } } } = config;
import { shard } from "../bot";
import prettyms from "pretty-ms";

export = (client: ModifiedClient) => new Manager({
    nodes: nodes,
    plugins: [
        new Spotify({ clientId, clientSecret })
    ],
    defaultSearchPlatform: "youtube",
    send(id, payload) {
        client.guilds.cache.get(id)?.shard.send(payload);
    }
})
    .on("trackError", async (player, { title }, error) => {
        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        try {
            await text.send(`An error occured when trying to play \`${title}\`: ${error.exception?.cause || error.error}`);
        } catch { };
    })
    .on("trackStuck", async (player, { title }, error) => {
        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        try {
            await text?.send(`\`${title}\` got stuck.`);
        } catch { };
    })
    .on("nodeConnect", ({ options }) => console.log(`${shard} Lava ${options.host}:${options.port} connected.`))
    .on("nodeError", ({ options }, error) => console.log(`${shard} Lava ${options.host}:${options.port} had an error: ${error.message}`))
    .on("trackStart", async (player, track) => {
        const voice = client.channels.cache.get(player.voiceChannel) as VoiceBasedChannel;
        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        if (!voice?.members.filter((m) => m.user.id !== client.user.id).size) {
            player.destroy();
            try {
                await text.send("Все участники покинули голосовой канал. Останавливаю плеер.");
            } catch { };
            return;
        };

        try {
            let message = player.get("message") as Message | undefined;
            if (!message) message = await text.send("⏳ Загрузка...");
            player.set("message", message);
        } catch { };
    })
    .on("queueEnd", async (player) => {
        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        try {
            let message = player.get("message") as Message | undefined;
            if (!message) await text.send({ content: "Очередь пуста. Останавливаю плеер.", embeds: [] });
            await message.edit({ content: "Очередь пуста. Останавливаю плеер.", embeds: [] });
        } catch { };

        player.destroy();
    })
    .init(client.user.id);