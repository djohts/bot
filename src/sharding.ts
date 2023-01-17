import { ClusterManager } from "discord-hybrid-sharding";
import { managerLogger } from "./utils/logger/manager";
import { postStats } from "./utils/sharding/postStats";
import { inspect } from "util";
import config from "./constants/config";
import cli from "./utils/sharding/cli";

managerLogger.info("=".repeat(55));

export const manager = new ClusterManager(__dirname + "/bot.js", {
    totalClusters: config.clusters,
    totalShards: config.shards,
    token: config.bot.token,
    execArgv: ["--no-warnings"],
    mode: "process"
});
cli(manager);

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
        if (config.monitoring.bc && config.monitoring.topgg && config.monitoring.dbl) {
            postStats();
            setInterval(() => postStats(), 1000 * 60 * 60);
        };
    }, 2 * 60 * 1000);
});

process.on("unhandledRejection", (e) => managerLogger.error("unhandledRejection:" + inspect(e)));
process.on("uncaughtException", (e) => managerLogger.error("uncaughtException:" + inspect(e)));