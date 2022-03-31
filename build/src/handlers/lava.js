"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const erela_js_1 = require("erela.js");
const erela_js_spotify_1 = __importDefault(require("erela.js-spotify"));
const config_1 = __importDefault(require("../../config"));
const { lava: { nodes, spotify: { clientID, clientSecret } } } = config_1.default;
const bot_1 = require("../bot");
module.exports = (client) => new erela_js_1.Manager({
    nodes: nodes,
    plugins: [new erela_js_spotify_1.default({ clientID, clientSecret })],
    defaultSearchPlatform: "youtube",
    send(id, payload) {
        client.guilds.cache.get(id)?.shard.send(payload);
    }
})
    .on("trackError", ({ textChannel }, { title }, error) => {
    const text = client.channels.cache.get(textChannel);
    text?.send(`An error occured when trying to play \`${title}\`: ${error.exception?.cause || error.error}`).catch(() => null);
})
    .on("trackStuck", ({ textChannel }, { title }, error) => {
    const text = client.channels.cache.get(textChannel);
    text?.send(`\`${title}\` got stuck.`).catch(() => null);
})
    .on("nodeConnect", ({ options }) => console.log(`${bot_1.shard} Lava ${options.host}:${options.port} connected.`))
    .on("nodeError", ({ options }, error) => console.log(`${bot_1.shard} Lava ${options.host}:${options.port} had an error: ${error.message}`))
    .on("trackStart", async ({ voiceChannel, textChannel, destroy }, track) => {
    const voice = client.channels.cache.get(voiceChannel);
    const text = client.channels.cache.get(textChannel);
    if (!voice?.members.filter((m) => m.user.id != client.user.id).size) {
        destroy();
        return text?.send("Все участники покинули голосовой канал. Останавливаю плеер.").catch(() => null);
    }
    ;
    text?.send(`Играю:\n\`${track.title}\``).catch(() => null);
})
    .on("queueEnd", async (player) => {
    const text = client.channels.cache.get(player.textChannel);
    text?.send("Очередь пуста. Останавливаю плеер.").catch(() => null);
    player.destroy();
})
    .init(client.user.id);
