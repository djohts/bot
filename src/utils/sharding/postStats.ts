import { managerLogger } from "../logger/manager";
import { manager } from "../../sharding";
import config from "../../constants/config";
import axios from "axios";

export async function postStats(): Promise<void> {
    const guilds = await manager
        .broadcastEval((bot) => bot.guilds.cache.size)
        .then((res) => res.reduce((acc, val) => acc + val, 0));
    const users = await manager
        .broadcastEval((bot) => bot.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b))
        .then((res) => res.reduce((prev, val) => prev + val, 0));
    const guildsPerShard = await manager
        .broadcastEval((bot) => bot.ws.shards.map((shard) => bot.guilds.cache.filter((g) => g.shardId === shard.id).size))
        .then((res) => res.flat());

    const promises = [
        axios.post("https://api.boticord.top/v2/stats", {
            servers: guilds,
            shards: guildsPerShard.length,
            users
        }, {
            headers: {
                Authorization: `Bot ${config.monitoring.bc}`,
                "Content-Type": "application/json"
            }
        }).catch((e) => {
            managerLogger.error(`failed to post stats to boticord: ${e}`);
        }),
        axios.post(`https://top.gg/api/bots/${config.bot.id}/stats`, {
            server_count: guildsPerShard
        }, {
            headers: {
                Authorization: config.monitoring.topgg,
                "Content-Type": "application/json"
            }
        }).catch((e) => {
            managerLogger.error(`failed to post stats to topgg: ${e}`);
        }),
        axios.post(`https://discordbotlist.com/api/v1/bots/${config.bot.id}/stats`, {
            guilds,
            users
        }, {
            headers: {
                Authorization: config.monitoring.dbl,
                "Content-Type": "application/json"
            }
        }).catch((e) => {
            managerLogger.error(`failed to post stats to dbl: ${e}`);
        }),
    ];

    return void Promise.all(promises);
};