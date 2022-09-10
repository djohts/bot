import { BcBotBumpAction, BcBotCommentAction } from "../../constants/types";
import { FastifyInstance, HookHandlerDoneFunction } from "fastify";
import { Client, WebhookClient } from "discord.js";
import { manager } from "../../sharding";
import config from "../../../config";
import axios from "axios";
const wh = new WebhookClient({ url: config.notifications_webhook });

export = (fastify: FastifyInstance, _: any, done: HookHandlerDoneFunction) => {
    fastify.get("/stats", async (_, res) => {
        const newBotInfo = await manager.broadcastEval((bot) => ({
            status: bot.ws.status,
            guilds: bot.guilds.cache.size,
            cachedUsers: bot.users.cache.size,
            channels: bot.channels.cache.size,
            users: bot.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0),
            ping: bot.ws.ping,
            loading: bot.loading,
            connecting: bot.connecting
        })).then((results) => results.reduce((info, next, index) => {
            for (const [key, value] of Object.entries(next)) {
                if (["guilds", "cachedUsers", "channels", "users"].includes(key)) info[key] = (info[key] || 0) + value;
            };
            info.clusters[index] = next;
            return info;
        }, {
            clusters: {} as {
                status: number;
                guilds: number;
                cachedUsers: number;
                channels: number;
                users: number;
                ping: number;
                loading: boolean;
                connecting: boolean;
            },
            guilds: 0,
            cachedUsers: 0,
            channels: 0,
            users: 0,
            lastUpdate: 0
        }));
        newBotInfo.lastUpdate = Date.now();
        res.send(newBotInfo);
    });
    fastify.get("/metrics", async (req, res) => {
        const data = (await axios("http://0.0.0.0:4000/api/stats").then((res) => res.data)) as {
            clusters: {
                [key: string]: {
                    status: string;
                    guilds: number;
                    cachedUsers: number;
                    channels: number;
                    users: number;
                    ping: number;
                    loading: boolean;
                };
            };
            guilds: number;
            cachedUsers: number;
            channels: number;
            users: number;
            lastUpdate: number;
        };

        const metricObject = {
            total_guilds: data.guilds,
            total_channels: data.channels,
            total_users: data.users,
            total_cached_users: data.cachedUsers,
            average_ping: Object.values(data.clusters).reduce((total, next) => total + next.ping, 0) / Object.keys(data.clusters).length,

            cluster_guilds: {},
            cluster_channels: {},
            cluster_users: {},
            cluster_cached_users: {},
            cluster_ping: {},
        } as { [key: string]: number | { [key: string]: number } };

        for (const [key, value] of Object.entries(data.clusters)) {
            metricObject["cluster_guilds"][key] = value.guilds;
            metricObject["cluster_channels"][key] = value.channels;
            metricObject["cluster_users"][key] = value.users;
            metricObject["cluster_cached_users"][key] = value.cachedUsers;
            metricObject["cluster_ping"][key] = value.ping;
        };

        res.type("text/plain").send(prometheusMetrics(metricObject));
    });
    fastify.get("/invite/:guildid", (req: any, res) => {
        const guildid = req.params.guildid;
        const botid = config.client.id;
        guildid ? res.redirect([
            "https://discord.com/oauth2/authorize",
            `?client_id=${botid}`,
            `&guild_id=${guildid}`,
            "&scope=bot%20applications.commands",
            "&permissions=1375450033182"
        ].join("")) : res.redirect([
            "https://discord.com/oauth2/authorize",
            `?client_id=${botid}`,
            "&scope=bot%20applications.commands",
            "&permissions=1375450033182"
        ].join(""));
    });
    fastify.post("/webhook/boticord", async (req, res) => {
        if (req.headers["x-hook-key"] !== config.monitoring.bc_hook_key) return res.status(403).send();
        const options = req.body as BcBotBumpAction | BcBotCommentAction;
        let vote: string;

        switch (options.type) {
            case "new_bot_bump":
                manager.broadcastEval((bot: Client, options: BcBotBumpAction) => {
                    bot.util.func.processBotBump(options);
                }, { cluster: 0, context: options });
                break;
            case "new_bot_comment":
                if ((options as BcBotCommentAction).data.comment.vote.new === 1) vote = "Позитивная";
                else if ((options as BcBotCommentAction).data.comment.vote.new === -1) vote = "Негативная";
                else vote = "Нейтральная";
                await wh.send({
                    embeds: [{
                        title: "Новый комментарий",
                        description: [
                            `<@${options.data.user}>:`,
                            (options as BcBotCommentAction).data.comment.new
                        ].join("\n"),
                        fields: [{
                            name: "Оценка",
                            value: vote
                        }]
                    }],
                    username: "ботикорд"
                });
                break;
            case "edit_bot_comment":
                if ((options as BcBotCommentAction).data.comment.vote.new === 1) vote = "Позитивная";
                else if ((options as BcBotCommentAction).data.comment.vote.new === -1) vote = "Негативная";
                else vote = "Нейтральная";
                await wh.send({
                    embeds: [{
                        title: "Комментарий изменён",
                        description: [
                            `<@${options.data.user}>:`,
                            (options as BcBotCommentAction).data.comment.new
                        ].join("\n"),
                        fields: [{
                            name: "Оценка",
                            value: vote
                        }]
                    }],
                    username: "ботикорд"
                });
                break;
        };
        return res.status(202);
    });
    done();
};

const isdev = !config.monitoring.bc;
function prometheusMetrics(obj: { [key: string]: number | { [key: string]: number } }): string {
    const metrics = [];
    for (let [key, value] of Object.entries(obj)) {
        if (isdev) key = `d${key}`;
        const prefix = [
            `# HELP ${key} todo`,
            `# TYPE ${key} gauge`
        ].join("\n");

        metrics.push(prefix);

        if (typeof value === "number") {
            metrics.push(`${key} ${value}`);
        } else {
            for (const subkey in value) {
                metrics.push(`${key}{subkey="${subkey}",} ${value[subkey]}`);
            };
        };
    };
    return metrics.join("\n");
};