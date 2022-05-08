import { TextChannel, VoiceBasedChannel, Message } from "discord.js";
import { ModifiedClient } from "../constants/types";
import { Manager } from "erela.js";
import Spotify from "erela.js-spotify";
import { splitBar } from "string-progressbar";
import config from "../../config";
const { lava: { nodes, spotify: { clientID, clientSecret } } } = config;
import { shard } from "../bot";
import prettyms from "pretty-ms";

export = (client: ModifiedClient) => new Manager({
    nodes: nodes,
    plugins: [new Spotify({ clientID, clientSecret })],
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

            const duration = Math.floor(track.duration / 1000) * 1000;
            const position = Math.floor(player.position / 1000) * 1000;
            const progressComponent = [
                splitBar(duration, position, 20)[0],
                ` [`,
                prettyms(position, { colonNotation: true, compact: true }),
                ` / `,
                prettyms(duration, { colonNotation: true, compact: true }),
                `]`
            ].join("");
            await message.edit({
                content: `🎶 Сейчас играет: ${track.title}`,
                embeds: [{
                    title: track.title,
                    url: track.uri,
                    thumbnail: {
                        url: track.thumbnail
                    },
                    fields: [{
                        name: "Автор",
                        value: track.author,
                        inline: true
                    }, {
                        name: "Прогресс",
                        value: progressComponent,
                    }]
                }]
            });
            const interval = setInterval(async () => {
                const duration = Math.floor(track.duration / 1000) * 1000;
                const position = Math.floor(player.position / 1000) * 1000;
                const progressComponent = [
                    splitBar(duration, position, 20)[0],
                    ` [`,
                    prettyms(position, { colonNotation: true, compact: true }),
                    ` / `,
                    prettyms(duration, { colonNotation: true, compact: true }),
                    `]`
                ].join("");
                await message.edit({
                    content: `🎶 Сейчас играет: ${track.title}`,
                    embeds: [{
                        title: track.title,
                        url: track.uri,
                        thumbnail: {
                            url: track.thumbnail
                        },
                        fields: [{
                            name: "Автор",
                            value: track.author,
                            inline: true
                        }, {
                            name: "Прогресс",
                            value: progressComponent,
                        }]
                    }]
                });
            }, 5000);
            setTimeout(() => clearInterval(interval), track.duration);
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