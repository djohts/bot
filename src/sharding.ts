require("nodejs-better-console").overrideConsole();
import { ShardingManager } from "discord.js";
import readline from "readline";
import config from "../config";
import { inspect } from "util";
const read = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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

process.on("unhandledRejection", (e) => console.error("[Manager]", "unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("[Manager]", "uncaughtException:", e));

read.on("line", async (line) => {
    if (!line) return;
    const [cmd, ...args] = line.split(" ");
    let _manager = manager;
    console.log(`[Manager CLI] Received command: ${line}`);
    if (cmd === "eval") {
        const script = args.join(" ");
        console.log(`[Manager CLI] Evaluating: ${script}`);
        try {
            console.log(`[Manager CLI] Result:`, inspect(await eval(script), { depth: 2 }));
        } catch (e) {
            console.error(`[Manager CLI] Error: ${e}`);
        };
    } else if (cmd === "beval") {
        let shard = parseInt(args[0]);
        if (isNaN(shard)) shard = undefined;
        const script = args.slice(1).join(" ");
        console.log(`[Manager CLI] Evaluating on ${shard !== undefined ? `shard ${shard}` : "all shards"}: ${script}`);
        try {
            const result = await _manager.broadcastEval(async (bot, { script }) => await eval(script), { shard, context: { script } });
            console.log(`[Manager CLI] Result:`, inspect(result, { depth: 2 }));
        } catch (e) {
            console.error(`[Manager CLI] Error:`, e);
        };
    } else if (cmd === "respawn") {
        let shard = parseInt(args[0]);
        if (!isNaN(shard)) {
            const opts = args.slice(1).reduce((acc, arg) => {
                const [key, value] = arg.split("=");
                acc[key] = value;
                return acc;
            }, { delay: 500, timeout: -1 });
            console.log(`[Manager CLI] Respawning shard ${shard} with ${JSON.stringify(opts)}`);
            await _manager.shards.get(shard).respawn(opts);
        } else {
            const opts = args.slice(1).reduce((acc, arg) => {
                const [key, value] = arg.split("=");
                acc[key] = value;
                return acc;
            }, { shardDelay: 5000, respawnDelay: 500, timeout: -1 });
            console.log(`[Manager CLI] Respawning all shards with ${JSON.stringify(opts)}`);
            await _manager.respawnAll(opts);
        };
    };
});