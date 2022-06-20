"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const Util_1 = __importDefault(require("../util/Util"));
function updatePresence() {
    Util_1.default.client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => {
        const gc = res.reduce((prev, curr) => prev + curr, 0);
        const aaaaaaa = gc <= 400 ? "400" : gc <= 500 ? "500" : gc <= 600 ? "600" : gc <= 700 ? "700" : gc <= 800 ? "800" : gc <= 900 ? "900" : "1000";
        Util_1.default.client.user.setPresence({
            status: "idle",
            activities: [{ type: "PLAYING", name: `${aaaaaaa}? -> | ${gc} guilds` }],
        });
        setTimeout(() => updatePresence(), 5 * 60 * 1000);
    });
}
;
function checkBans() {
    Promise.all(Util_1.default.client.guilds.cache.map((guild) => Util_1.default.func.checkGuildBans(guild)))
        .then(() => setTimeout(() => checkBans(), 10 * 1000));
}
;
function tickMusicPlayers() {
    Promise.all(Util_1.default.lava.players.map((player) => Util_1.default.func.tickMusicPlayers(player)))
        .then(() => setTimeout(() => tickMusicPlayers(), 10 * 1000));
}
;
function updateGuildStatsChannels() {
    Promise.all(Util_1.default.client.guilds.cache.map((guild) => Util_1.default.func.updateGuildStatsChannels(guild.id)))
        .then(() => setTimeout(() => updateGuildStatsChannels(), 10 * 60 * 1000));
}
;
module.exports = () => {
    updatePresence();
    checkBans();
    tickMusicPlayers();
    updateGuildStatsChannels();
};
