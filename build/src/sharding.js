"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manager = void 0;
require("nodejs-better-console").overrideConsole();
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
exports.manager = new discord_js_1.ShardingManager(__dirname + "/bot.js", {
    totalShards: config_1.default.shards,
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
    try {
        require("./web/")();
    }
    catch (e) {
        console.error(e);
    }
    ;
}
;
exports.manager.spawn({ timeout: -1 }).then(() => {
    setTimeout(async () => {
        if (config_1.default.monitoring?.sdc && config_1.default.monitoring?.bc) {
            setInterval(async () => {
                await postStats();
            }, 1 * 60 * 60 * 1000);
            await postStats();
        }
        ;
    }, 1 * 60 * 1000);
});
process.on("unhandledRejection", (e) => console.error("[Manager]", "unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("[Manager]", "uncaughtException:", e));
async function postStats() {
    const stats = {
        sdc: {
            shards: exports.manager.shards.size,
            servers: await exports.manager.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((acc, val) => acc + val, 0))
        },
        bc: {
            servers: await exports.manager.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((acc, val) => acc + val, 0)),
            shards: exports.manager.shards.size,
            users: await exports.manager.broadcastEval((bot) => bot.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b)).then((res) => res.reduce((prev, val) => prev + val, 0))
        }
    };
    await (0, axios_1.default)("https://api.server-discord.com/v2/bots/889214509544247306/stats", {
        method: "POST",
        headers: {
            "Authorization": `SDC ${config_1.default.monitoring.sdc}`,
            "Content-Type": "application/json"
        },
        data: JSON.stringify(stats.sdc)
    }).then((res) => {
        if (res.status !== 200) {
            console.error(`[Manager] Failed to post stats to SDC: ${res.status}`);
        }
        ;
    });
    await (0, axios_1.default)("https://api.boticord.top/v1/stats", {
        method: "POST",
        headers: {
            "Authorization": config_1.default.monitoring.bc,
            "Content-Type": "application/json"
        },
        data: JSON.stringify(stats.bc)
    }).then((res) => {
        if (res.status !== 200) {
            return console.error(`[Manager] Failed to post stats to BC: ${res.status}`);
        }
        ;
        if (!res.data.ok) {
            return console.error(`[Manager] Failed to post stats to BC: ${res.statusText}`);
        }
        ;
    });
}
;
