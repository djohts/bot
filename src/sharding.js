require("nodejs-better-console").overrideConsole();
const { ShardingManager } = require("discord.js");
const fetch = require("node-fetch");
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

if (config.sdcToken) {
    (async () => {
        await postStats();
        setInterval(postStats, 5 * 60 * 1000);
    })();
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
        info.shards[index] = next;
        return info;
    }, { shards: {} }));
    newBotInfo.lastUpdate = Date.now();
    return botInfo = newBotInfo;
};

async function postStats() {
    const sdcToken = "SDC " + config.sdcToken;
    const route = "https://api.server-discord.com/v2";
    const shardCount = manager.totalShards;
    const guildCount = await manager.broadcastEval(bot => bot.guilds.cache.size).then((res) => res.reduce((total, current) => total + current, 0));
    const botUser = await manager.broadcastEval(bot => bot.user).then((res) => res[0]);

    await fetch(route + `/bots/${botUser.id}/stats`, {
        method: "post",
        body: JSON.stringify({
            shards: shardCount,
            servers: guildCount
        }),
        headers: {
            "Content-type": "application/json",
            "Authorization": sdcToken
        }
    }).then(async (res) => console.info("[SDC API] Posted stats for " + botUser.tag, await res.json()));
};

manager.spawn({ delay: 10 * 1000, timeout: -1 });