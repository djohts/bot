import { TextChannel, VoiceBasedChannel } from "discord.js";
import { ModifiedClient } from "../constants/types";
import { Manager } from "erela.js";
import Spotify from "erela.js-spotify";
const { lava: { nodes, spotify: { clientID, clientSecret } } } = require("../../config");
import { shard } from "../bot";

export = (client: ModifiedClient) => new Manager({
    nodes: nodes,
    plugins: [new Spotify({ clientID, clientSecret })],
    send(id, payload) {
        client.guilds.cache.get(id)?.shard.send(payload);
    }
})
    .on("trackError", console.log)
    .on("trackStuck", console.log)
    .on("nodeConnect", ({ options }) => console.log(`${shard} Lava ${options.host}:${options.port} connected.`))
    .on("nodeError", ({ options }, error) => console.log(`${shard} Lava ${options.host}:${options.port} had an error: ${error.message}`))
    .on("trackStart", async ({ voiceChannel, textChannel, destroy }, track) => {
        const voice = client.channels.cache.get(voiceChannel) as VoiceBasedChannel;
        const text = client.channels.cache.get(textChannel) as TextChannel;

        if (!voice?.members.filter((m) => m.user.id != client.user.id).size)
            return text?.send("Все участники покинули голосовой канал. Останавливаю плеер.").catch(() => null) && destroy();

        text?.send(`Играю:\n\`${track.title}\``).catch(() => null);
    })
    .on("queueEnd", async ({ textChannel, destroy }) => {
        const text = client.channels.cache.get(textChannel) as TextChannel;
        text?.send("Очередь пуста. Останавливаю плеер.").catch(() => null);

        destroy();
    })
    .init(client.user.id);