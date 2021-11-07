require("nodejs-better-console").overrideConsole();
const { ShardingManager } = require("discord.js");
const config = require("../config");
const express = require("express");

const manager = new ShardingManager(__dirname + "/bot.js", {
    totalShards: config.shards || "auto",
    token: config.token,
    mode: "worker"
});

manager.on("shardCreate", async (shard) => {
    shard.on("message", (m) => {
        if (m == "respawn") {
            console.warn(`[Manager] Shard ${shard.id} has requested a restart.`);
            shard.respawn();
        };
    });
    console.log(`[Manager] Shard ${shard.id} is starting.`);
});

let botInfo = {};

if (config.port) {
    const api = express();

    setInterval(updateBotInfo, 5000);

    api.get("/", (_, res) => res.json(botInfo));
    api.get("/newest", async (_, res) => res.json(await updateBotInfo()));

    api.listen(config.port);
};

async function updateBotInfo() {
    const newBotInfo = await manager.broadcastEval(bot => ({
        status: bot.ws.status,
        guilds: bot.guilds.cache.size,
        cachedUsers: bot.users.cache.size,
        users: bot.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0),
        ping: bot.ws.ping,
        loading: bot.loading
    })).then(results => results.reduce((info, next, index) => {
        for (const [key, value] of Object.entries(next)) {
            if (["guilds", "cachedUsers", "users"].includes(key)) info[key] = (info[key] || 0) + value;
        };
        info.shards[`${index}`] = next;
        return info;
    }, { shards: {} }));
    newBotInfo.lastUpdate = Date.now();
    return botInfo = newBotInfo;
};

manager.spawn({ delay: 3000, timeout: -1 });