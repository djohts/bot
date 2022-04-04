"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manager = void 0;
require("nodejs-better-console").overrideConsole();
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../config"));
exports.manager = new discord_js_1.ShardingManager(__dirname + "/bot.js", {
    token: config_1.default.token,
    mode: "worker"
});
exports.manager.on("shardCreate", (shard) => {
    shard.on("message", (m) => {
        if (m == "respawn") {
            console.warn(`[Manager] Shard ${shard.id} has requested a restart.`);
            shard.respawn();
        }
        ;
    });
    console.log(`[Manager] Shard ${shard.id} is starting.`);
});
if (config_1.default.port) {
    require("./web/")();
}
;
exports.manager.spawn();
process.on("unhandledRejection", (e) => console.error("[Manager]", "unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("[Manager]", "uncaughtException:", e));
