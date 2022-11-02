import { managerLogger } from "./util/logger/manager";
import { inspect } from "util";
import Sharding from "discord-hybrid-sharding";
import config from "./constants/config";
import utils from "./util/sharding";
import axios from "axios";

managerLogger.info("=".repeat(55));

export const manager = new Sharding.Manager(__dirname + "/bot.js", {
    totalShards: config.shards,
    shardsPerClusters: config.shardsPerClusters,
    token: config.token,
    execArgv: ["--no-warnings"],
    mode: "process"
});
utils(manager);

manager.on("clusterCreate", (cluster) => {
    cluster.on("message", (m) => {
        if (m === "respawn") {
            managerLogger.warn(`Cluster ${cluster.id} has requested a restart.`);
            cluster.respawn();
        };
    });
    managerLogger.info(`Cluster ${cluster.id} is starting.`);
});

if (config.port) {
    try {
        require("./web/")();
    } catch (e) {
        managerLogger.error(e);
    };
};

manager.spawn({ timeout: -1, delay: 10000 }).then(() => {
    setTimeout(() => {
        if (config.monitoring?.bc && config.monitoring.topgg) {
            postStats();
            setInterval(() => postStats(), 1000 * 60 * 60);
        };
    }, 2 * 60 * 1000);
});

process.on("unhandledRejection", (e) => managerLogger.error("unhandledRejection:" + inspect(e)));
process.on("uncaughtException", (e) => managerLogger.error("uncaughtException:" + inspect(e)));

async function postStats(): Promise<void> {
    const stats = {
        guilds: await manager
            .broadcastEval((bot) => bot.guilds.cache.size)
            .then((res) => res.reduce((acc, val) => acc + val, 0)),
        users: await manager
            .broadcastEval((bot) => bot.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b))
            .then((res) => res.reduce((prev, val) => prev + val, 0)),
        guildsPerShard: await manager
            .broadcastEval((bot) => bot.ws.shards.map((shard) => bot.guilds.cache.filter((g) => g.shardId === shard.id).size))
            .then((res) => res.flat())
    };

    const promises = [
        axios("https://api.boticord.top/v2/stats", {
            data: JSON.stringify({
                servers: stats.guilds,
                shards: stats.guildsPerShard.length,
                users: stats.users
            }),
            method: "POST",
            headers: {
                Authorization: `Bot ${config.monitoring.bc}`,
                "Content-Type": "application/json"
            }
        }).catch((e) => {
            managerLogger.error(`failed to post stats to boticord: ${e}`);
        }),
        axios(`https://top.gg/api/bots/${config.client.id}/stats`, {
            data: JSON.stringify({
                server_count: stats.guildsPerShard
            }),
            method: "POST",
            headers: {
                Authorization: config.monitoring.topgg,
                "Content-Type": "application/json"
            }
        }).catch((e) => {
            managerLogger.error(`failed to post stats to topgg: ${e}`);
        })
    ];

    return void Promise.all(promises);
};