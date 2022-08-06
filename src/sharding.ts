require("nodejs-better-console").overrideConsole();
import { ShardingManager } from "discord.js";
import axios from "axios";
import config from "../config";

export const manager = new ShardingManager(__dirname + "/bot.js", {
    totalShards: config.shards,
    token: config.token,
    mode: "worker"
});

manager.on("shardCreate", (shard) => {
    shard.on("message", (m) => {
        if (m == "respawn") {
            console.warn(`[Manager] Shard ${shard.id} has requested a restart.`);
            shard.respawn();
        };
    });
    console.log(`[Manager] Shard ${shard.id} is starting.`);
});

if (config.port) {
    try {
        require("./web/")();
    } catch (e) {
        console.error(e);
    };
};

manager.spawn({ timeout: -1 }).then(() => {
    setTimeout(async () => {
        if (config.monitoring?.sdc && config.monitoring?.bc) {
            setInterval(async () => {
                await postStats();
            }, 1 * 60 * 60 * 1000);
            await postStats();
        };
    }, 1 * 60 * 1000);
});

process.on("unhandledRejection", (e) => console.error("[Manager]", "unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("[Manager]", "uncaughtException:", e));

async function postStats() {
    const stats = {
        sdc: {
            shards: manager.shards.size,
            servers: await manager.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((acc, val) => acc + val, 0))
        },
        bc: {
            servers: await manager.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((acc, val) => acc + val, 0)),
            shards: manager.shards.size,
            users: await manager.broadcastEval((bot) =>
                bot.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b)
            ).then((res) => res.reduce((prev, val) => prev + val, 0))
        }
    };
    await axios("https://api.server-discord.com/v2/bots/889214509544247306/stats", {
        method: "POST",
        headers: {
            "Authorization": `SDC ${config.monitoring.sdc}`,
            "Content-Type": "application/json"
        },
        data: JSON.stringify(stats.sdc)
    }).then((res) => {
        if (res.status !== 200) {
            console.error(`[Manager] Failed to post stats to SDC: ${res.status}`);
        };
    });
    await axios("https://api.boticord.top/v1/stats", {
        method: "POST",
        headers: {
            "Authorization": config.monitoring.bc,
            "Content-Type": "application/json"
        },
        data: JSON.stringify(stats.bc)
    }).then((res) => {
        if (res.status !== 200) {
            return console.error(`[Manager] Failed to post stats to BC: ${res.status}`);
        };
        if (!res.data.ok) {
            return console.error(`[Manager] Failed to post stats to BC: ${res.statusText}`);
        };
    });
};