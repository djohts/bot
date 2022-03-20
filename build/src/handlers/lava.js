"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const erela_js_1 = require("erela.js");
const erela_js_spotify_1 = __importDefault(require("erela.js-spotify"));
const { lava: { nodes, spotify: { clientID, clientSecret } } } = require("../../config");
const bot_1 = require("../bot");
module.exports = (client) => {
    return new erela_js_1.Manager({
        nodes: nodes,
        plugins: [new erela_js_spotify_1.default({ clientID, clientSecret })],
        send(id, payload) {
            client.guilds.cache.get(id)?.shard.send(payload);
        }
    })
        .on("trackError", console.log)
        .on("trackStuck", console.log)
        .on("nodeConnect", ({ options }) => console.log(`${bot_1.shard} Lava ${options.host}:${options.port} connected.`))
        .on("nodeError", ({ options }, error) => console.log(`${bot_1.shard} Lava ${options.host}:${options.port} had an error: ${error.message}`))
        .on("trackStart", async ({ voiceChannel, textChannel, destroy }, track) => {
        const voice = client.channels.cache.get(voiceChannel);
        const text = client.channels.cache.get(textChannel);
        if (!voice?.members.filter((m) => m.user.id != client.user.id).size)
            return text?.send("Все участники покинули голосовой канал. Останавливаю плеер.").catch(() => null) && destroy();
        text?.send(`Играю:\n\`${track.title}\``).catch(() => null);
    })
        .on("queueEnd", async ({ textChannel, destroy }) => {
        const text = client.channels.cache.get(textChannel);
        text?.send("Очередь пуста. Останавливаю плеер.").catch(() => null);
        destroy();
    })
        .init(client.user.id);
};
