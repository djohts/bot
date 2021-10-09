const Discord = require("discord.js");
const config = require("../config");
const express = require("express");
const log = require("./handlers/logger");

const manager = new Discord.ShardingManager("./src/bot.js", {
    totalShards: config.shards || "auto",
    token: config.token,
    mode: "worker"
});

manager.on("shardCreate", shard => {
    shard.on("message", m => {
        if (m == "respawn") {
            log.log(`[Manager] Shard ${shard.id} has requested a restart.`);
            shard.respawn();
        };
    });
    log.log(`[Manager] Shard ${shard.id} is starting.`);
});

let botInfo = {};

if (config.port) {
    const api = express();

    setInterval(updateBotInfo, 5000);

    api.get("/", (_, response) => response.json(botInfo));
    api.get("/newest", async (_, response) => {
        const newInfo = await updateBotInfo();
        return response.json(newInfo);
    });
    api.listen(config.port);
};

async function updateBotInfo() {
    const newBotInfo = await manager.broadcastEval(client => ({
        status: client.ws.status,
        guilds: client.guilds.cache.size,
        cachedUsers: client.users.cache.size,
        users: client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0),
        ping: client.ws.ping,
        loading: client.loading
    })).then(results => results.reduce((info, next, index) => {
        for (const [key, value] of Object.entries(next))
            if (["guilds", "cachedUsers", "users"].includes(key))
                info[key] = (info[key] || 0) + value;
        info.shards[`${index}`] = next;
        return info;
    }, { shards: {} }));
    newBotInfo.lastUpdate = Date.now();
    return botInfo = newBotInfo;
};

manager.spawn(config.shards || "auto", 2000);