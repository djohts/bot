require("nodejs-better-console").overrideConsole();
import { ShardingManager } from "discord.js";
import fetch from "node-fetch";
import config from "../config";

export const manager = new ShardingManager(__dirname + "/bot.js", {
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
    require("./web/")();
};

if (config.sdcToken) {
    setTimeout(() => {
        postStats();
        setInterval(postStats, 30 * 60 * 1000);
    }, 5 * 60 * 1000);
};

async function postStats() {
    const statsObject = {
        guildCount: await manager.broadcastEval((bot) => bot.guilds.cache.size).then((x) => x.reduce((prev, now) => prev + now, 0)),
        shardCount: manager.shards.size
    };

    await fetch("https://api.server-discord.com/v2/bots/889214509544247306/stats", {
        method: "post",
        body: JSON.stringify(statsObject),
        headers: {
            "Content-type": "application/json",
            "Authorization": `SDC ${config.sdcToken}`
        }
    }).then(async (res) => {
        try {
            await res.json();
        } catch (e) {
            console.log(`[SDC API] Error.\n${e}\n`, res.headers);
        };
    });
};

manager.spawn();

process.on("unhandledRejection", (e) => console.error("[Manager]", e));
process.on("uncaughtException", (e) => console.error("[Manager]", e));