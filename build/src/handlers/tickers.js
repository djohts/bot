"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const utils_1 = require("./utils");
const Util_1 = __importDefault(require("../util/Util"));
function updatePresence(client) {
    client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => {
        const gc = res.reduce((prev, curr) => prev + curr, 0);
        client.user.setPresence({
            status: "idle",
            activities: [{ type: "PLAYING", name: `500? -> | ${gc} guilds` }],
        });
        setTimeout(() => updatePresence(client), 5 * 60 * 1000);
    });
}
;
function checkBans(client) {
    Promise.all(client.guilds.cache.map((guild) => (0, utils_1.checkGuildBans)(guild)))
        .then(() => setTimeout(() => checkBans(client), 10 * 1000));
}
;
function updatePlayerMessages() {
    Promise.all(Util_1.default.lava.players.map((player) => Util_1.default.func.updatePlayerMessage(player)))
        .then(() => setTimeout(() => updatePlayerMessages(), 10 * 1000));
}
;
module.exports = (client) => {
    updatePresence(client);
    checkBans(client);
    updatePlayerMessages();
};
