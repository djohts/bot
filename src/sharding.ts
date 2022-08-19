import { managerLogger } from "./util/logger/manager";
import Sharding from "discord-hybrid-sharding";
import utils from "./util/sharding";
import axios from "axios";
import config from "../config";
import { inspect } from "util";

managerLogger.info("=".repeat(55));

export const manager = new Sharding.Manager(__dirname + "/bot.js", {
    totalShards: config.shards,
    shardsPerClusters: config.shardsPerClusters,
    token: config.token,
    execArgv: ["--no-warnings"],
    mode: "worker"
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

manager.spawn({ timeout: -1 }).then(() => {
    setTimeout(() => {
        if (config.monitoring?.sdc && config.monitoring?.bc) {
            postStats();
            setInterval(() => void postStats(), 1000 * 60 * 60);
        };
    }, 1 * 60 * 1000);
});

process.on("unhandledRejection", (e) => managerLogger.error("unhandledRejection:" + inspect(e)));
process.on("uncaughtException", (e) => managerLogger.error("uncaughtException:" + inspect(e)));

async function postStats(): Promise<void> {
    const stats = {
        sdc: {
            shards: manager.totalShards,
            servers: await manager.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((acc, val) => acc + val, 0))
        },
        bc: {
            servers: await manager.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((acc, val) => acc + val, 0)),
            shards: manager.totalShards,
            users: await manager.broadcastEval((bot) =>
                bot.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b)
            ).then((res) => res.reduce((prev, val) => prev + val, 0))
        }
    };

    const promises = [
        axios("https://api.server-discord.com/v2/bots/889214509544247306/stats", {
            method: "POST",
            headers: {
                "Authorization": `SDC ${config.monitoring.sdc}`,
                "Content-Type": "application/json"
            },
            data: JSON.stringify(stats.sdc)
        }).then((res) => {
            if (res.status !== 200) {
                managerLogger.warn(`Failed to post stats to SDC: ${res.status}`);
            };
        }).catch(() => null),
        axios("https://api.boticord.top/v1/stats", {
            method: "POST",
            headers: {
                "Authorization": config.monitoring.bc,
                "Content-Type": "application/json"
            },
            data: JSON.stringify(stats.bc)
        }).then((res) => {
            if (res.status !== 200) {
                return managerLogger.warn(`[Manager] Failed to post stats to BC: ${res.status}`);
            };
            if (!res.data.ok) {
                return managerLogger.warn(`[Manager] Failed to post stats to BC: ${res.statusText}`);
            };
        }).catch(() => null)
    ];
    return void await Promise.all(promises);
};