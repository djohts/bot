"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const erela_js_1 = require("erela.js");
const better_erela_js_spotify_1 = __importDefault(require("better-erela.js-spotify"));
const config_1 = __importDefault(require("../../config"));
const { lava: { nodes, spotify: { clientId, clientSecret } } } = config_1.default;
const bot_1 = require("../bot");
module.exports = (client) => new erela_js_1.Manager({
    nodes: nodes,
    plugins: [
        new better_erela_js_spotify_1.default({ clientId, clientSecret })
    ],
    defaultSearchPlatform: "youtube",
    send(id, payload) {
        client.guilds.cache.get(id)?.shard.send(payload);
    }
})
    .on("trackError", async (player, track, error) => {
    const text = client.channels.cache.get(player.textChannel);
    try {
        await text.send(`An error occured when trying to play \`${track.title}\`: ${error.exception?.cause || error.error}`);
    }
    catch { }
    ;
})
    .on("trackStuck", async (player, track, error) => {
    const text = client.channels.cache.get(player.textChannel);
    try {
        await text.send(`\`${track.title}\` got stuck.`);
    }
    catch { }
    ;
})
    .on("nodeConnect", ({ options }) => console.log(`${bot_1.shard} Lava ${options.host}:${options.port} connected.`))
    .on("nodeError", ({ options }, error) => console.log(`${bot_1.shard} Lava ${options.host}:${options.port} had an error: ${error.message}`))
    .on("trackStart", async (player, track) => {
    const voice = client.channels.cache.get(player.voiceChannel);
    const text = client.channels.cache.get(player.textChannel);
    if (!voice?.members.filter((m) => m.user.id !== client.user.id).size) {
        try {
            let message = player.get("message");
            if (!message || !message.editable)
                await text.send({ content: "Все участники покинули голосовой канал. Останавливаю плеер.", embeds: [] });
            else
                await message.edit({ content: "Все участники покинули голосовой канал. Останавливаю плеер.", embeds: [] });
        }
        catch { }
        ;
        player.destroy();
        return;
    }
    ;
    try {
        let message = player.get("message");
        if (!message || !message.editable) {
            message = await text.send("⏳ Загрузка...");
            player.set("message", message);
        }
        ;
    }
    catch { }
    ;
})
    .on("queueEnd", async (player) => {
    const text = client.channels.cache.get(player.textChannel);
    try {
        let message = player.get("message");
        if (!message || !message.editable)
            await text.send({ content: "Очередь пуста. Останавливаю плеер.", embeds: [] });
        else
            await message.edit({ content: "Очередь пуста. Останавливаю плеер.", embeds: [] });
    }
    catch { }
    ;
    player.destroy();
})
    .init(client.user.id);
