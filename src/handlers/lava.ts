import { TextChannel, VoiceBasedChannel, Message } from "discord.js";
import { ModifiedClient } from "../constants/types";
import { Manager } from "erela.js";
import Spotify from "better-erela.js-spotify";
import config from "../../config";
const { lava: { nodes, spotify: { clientId, clientSecret } } } = config;
import { shard } from "../bot";

export = (client: ModifiedClient) => new Manager({
    nodes: nodes,
    plugins: [
        new Spotify({ clientId, clientSecret })
    ],
    send(id, payload) {
        client.guilds.cache.get(id)?.shard.send(payload);
    }
})
    .on("trackError", async (player, track, error) => {
        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        try {
            await text.send(`An error occured when trying to play \`${track.title}\`: ${error.exception?.cause || error.error}`);
        } catch { };
    })
    .on("trackStuck", async (player, track, error) => {
        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        try {
            await text.send(`\`${track.title}\` got stuck.`);
        } catch { };
    })
    .on("nodeConnect", ({ options }) => console.log(`${shard} Lava ${options.host}:${options.port} connected.`))
    .on("nodeError", ({ options }, error) => console.log(`${shard} Lava ${options.host}:${options.port} had an error: ${error.message}`))
    .on("trackStart", async (player, track) => {
        const voice = client.channels.cache.get(player.voiceChannel) as VoiceBasedChannel;
        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        if (!voice?.members.filter((m) => m.user.id !== client.user.id).size) {
            try {
                let message = player.get("message") as Message | undefined;
                if (!message || !message.editable) await text.send({ content: "Все участники покинули голосовой канал. Останавливаю плеер.", embeds: [] });
                else await message.edit({ content: "Все участники покинули голосовой канал. Останавливаю плеер.", embeds: [] });
            } catch { };
            player.destroy();
            return;
        };

        try {
            let message = player.get("message") as Message | undefined;
            if (!message || !message.editable) {
                message = await text.send("⏳ Загрузка...");
                player.set("message", message);
            };
        } catch { };
    })
    .on("queueEnd", async (player) => {
        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        try {
            let message = player.get("message") as Message | undefined;
            if (!message || !message.editable) await text.send({ content: "Очередь пуста. Останавливаю плеер.", embeds: [] });
            else await message.edit({ content: "Очередь пуста. Останавливаю плеер.", embeds: [] });
        } catch { };

        player.destroy();
    })
    .init(client.user.id);