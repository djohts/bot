"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manager = void 0;
require("nodejs-better-console").overrideConsole();
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../config"));
exports.manager = new discord_js_1.ShardingManager(__dirname + "/bot.js", {
    token: config_1.default.token,
    mode: "worker"
});
exports.manager.on("shardCreate", (shard) => {
    shard.on("message", (m) => {
        if (m == "respawn") {
            console.warn(`[Manager] Shard ${shard.id} has requested a restart.`);
            shard.respawn();
        }
        ;
    });
    console.log(`[Manager] Shard ${shard.id} is starting.`);
});
if (config_1.default.port) {
    require("./web/")();
}
;
if (config_1.default.sdcToken) {
    setTimeout(() => {
        postStats();
        setInterval(postStats, 30 * 60 * 1000);
    }, 5 * 60 * 1000);
}
;
async function postStats() {
    const statsObject = {
        guildCount: await exports.manager.broadcastEval((bot) => bot.guilds.cache.size).then((x) => x.reduce((prev, now) => prev + now, 0)),
        shardCount: exports.manager.shards.size
    };
    await fetch("https://api.server-discord.com/v2/bots/889214509544247306/stats", {
        method: "post",
        body: JSON.stringify(statsObject),
        headers: {
            "Content-type": "application/json",
            "Authorization": `SDC ${config_1.default.sdcToken}`
        }
    }).then(async (res) => {
        try {
            await res.json();
        }
        catch (e) {
            console.log(`[SDC API] Error.\n${e}\n`, res.headers);
        }
        ;
    });
}
;
exports.manager.spawn();
process.on("unhandledRejection", (e) => console.error("[Manager]", e));
process.on("uncaughtException", (e) => console.error("[Manager]", e));
