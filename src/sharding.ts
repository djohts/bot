require("nodejs-better-console").overrideConsole();
import { ShardingManager } from "discord.js";
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

manager.spawn();

process.on("unhandledRejection", (e) => console.error("[Manager]", e));
process.on("uncaughtException", (e) => console.error("[Manager]", e));