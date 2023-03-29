import { BcBotBumpAction, BcBotCommentAction } from "../../../types";
import { FastifyInstance, HookHandlerDoneFunction } from "fastify";
import { Client, WebhookClient } from "discord.js";
import { manager } from "../../sharding";
import config from "../../constants/config";

const wh = new WebhookClient({ url: config.notifications_webhook });

export default (fastify: FastifyInstance, _: any, done: HookHandlerDoneFunction) => {
    fastify.get("/stats", async (_, res) => {
        const newBotInfo = await manager.broadcastEval((bot) => ({
            status: bot.ws.status,
            guilds: bot.guilds.cache.size,
            cachedUsers: bot.users.cache.size,
            channels: bot.channels.cache.size,
            users: bot.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0),
            ping: bot.ws.ping,
            loading: bot.loading,
            connecting: !bot.isReady()
        })).then((results) => results.reduce<BotStats>((info, next) => {
            for (const [k, v] of Object.entries(next)) {
                if (["guilds", "cachedUsers", "channels", "users"].includes(k)) {
                    const key = k as Exclude<keyof typeof info, "clusters" | "lastUpdate">;
                    const value = v as number;

                    info[key] = (info[key] || 0) + value;
                };
            };

            info.clusters.push(next);

            return info;
        }, {
            clusters: [],
            guilds: 0,
            cachedUsers: 0,
            channels: 0,
            users: 0,
            lastUpdate: 0
        }));
        newBotInfo.lastUpdate = Date.now();
        res.send(newBotInfo);
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

type ClusterStats = {
    status: number;
    guilds: number;
    cachedUsers: number;
    channels: number;
    users: number;
    ping: number;
    loading: boolean;
    connecting: boolean;
};

type BotStats = {
    clusters: ClusterStats[];
    guilds: number;
    cachedUsers: number;
    channels: number;
    users: number;
    lastUpdate: number;
};