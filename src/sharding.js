require("nodejs-better-console").overrideConsole();
const { ShardingManager } = require("discord.js");
const fetch = require("node-fetch");
const config = require("../config");

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

if (config.port) {
    require("./web/")(manager);
};

if (config.sdcToken) {
    new Promise((res) => setTimeout(() => res(), 5 * 60 * 1000)).then(async () => {
        await postStats();
        setInterval(postStats, 30 * 60 * 1000);
    });
};

async function postStats() {
    const guildCount = await manager.broadcastEval((bot) => bot.guilds.cache.size).then((x) => x.reduce((prev, now) => prev + now, 0));
    const shardCount = manager.shards.size;

    await fetch("https://api.server-discord.com/v2/bots/889214509544247306/stats", {
        method: "post",
        body: JSON.stringify({
            servers: guildCount,
            shards: shardCount
        }),
        headers: {
            "Content-type": "application/json",
            "Authorization": `SDC ${config.sdcToken}`
        }
    }).then(async (res) => {
        try {
            await res.json();
        } catch {
            console.log("[SDC API] Error. ", res.headers);
        };
    });
};

manager.spawn({ delay: 6 * 1000, timeout: -1 });