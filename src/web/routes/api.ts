import { FastifyInstance, HookHandlerDoneFunction } from "fastify";
import config from "../../../config";
import discordoauth2 from "discord-oauth2";
import { manager } from "../../sharding";
import { SessionUser, CustomGuild, BcBotBumpAction, BcBotCommentAction } from "../../constants/types";
import { Client, PermissionFlagsBits, PermissionsBitField, WebhookClient } from "discord.js";
import axios from "axios";
const wh = new WebhookClient({ url: config.notifications_webhook });
const oauth2 = new discordoauth2({
    clientId: config.client.id,
    clientSecret: config.client.secret,
    redirectUri: config.redirectUri
});

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
        const sharddata = (await axios("http://localhost:4000/api/stats").then((response) => response.data)) as {
            clusters: {
                [key: string]: {
                    status: string,
                    guilds: number,
                    cachedUsers: number,
                    channels: number,
                    users: number,
                    ping: number,
                    loading: boolean
                }
            },
            guilds: number,
            cachedUsers: number,
            channels: number,
            users: number,
            lastUpdate: number
        };

        const metricObject = {
            total_guilds: sharddata.guilds,
            total_channels: sharddata.channels,
            total_users: sharddata.users,
            total_cached_users: sharddata.cachedUsers,
            average_ping: Object.values(sharddata.clusters).reduce((total, next) => total + next.ping, 0) / Object.keys(sharddata.clusters).length,

            shard_guilds: {},
            shard_channels: {},
            shard_users: {},
            shard_cached_users: {},
            shard_ping: {},
        } as { [key: string]: number | { [key: string]: number } };

        for (const [key, value] of Object.entries(sharddata.clusters)) {
            metricObject["shard_guilds"][key] = value.guilds;
            metricObject["shard_channels"][key] = value.channels;
            metricObject["shard_users"][key] = value.users;
            metricObject["shard_cached_users"][key] = value.cachedUsers;
            metricObject["shard_ping"][key] = value.ping;
        };

        res.type("text/plain");
        res.send(prometheusMetrics(metricObject));
    });
    fastify.get("/login", (_, res) => {
        res.redirect(oauth2.generateAuthUrl({
            scope: ["identify", "guilds"],
            responseType: "code",
        }));
    });
    fastify.get("/logout", (req: any, res) => {
        req.session.user = null;
        res.redirect(req.session.lastPage);
    });
    fastify.get("/authorize", async (req: any, res) => {
        const a = await oauth2.tokenRequest({
            code: req.query.code,
            scope: ["identify", "guilds"],
            grantType: "authorization_code"
        }).catch(() => res.redirect(req.session.lastPage));

        if (!a.access_token) return res.redirect("/api/login");

        const user = await oauth2.getUser(a.access_token);
        req.session.user = user;
        req.session.user.guilds = await oauth2.getUserGuilds(a.access_token);
        res.redirect(req.session.lastPage);
    });
    fastify.get("/user/guilds", (req: any, res): any => {
        const user = req.session.user as SessionUser | null;
        if (!user) return res.redirect("/api/login");

        const guilds: CustomGuild[] = [];

        user.guilds.map((rawguild) => {
            guilds.push({
                id: rawguild.id,
                name: rawguild.name,
                iconUrl: rawguild.icon ? `https://cdn.discordapp.com/icons/${rawguild.id}/${rawguild.icon}.png` : null,
                managed: new PermissionsBitField().add(rawguild.permissions as any).has(PermissionFlagsBits.Administrator)
            });
        });

        res.send(guilds);
    });
    fastify.get("/bot/isinuguild/:guild", async (req: any, res) => {
        const { guild } = req.params as { guild: string };
        if (!guild) return res.send({ isinuguild: false });
        const isinuguild = await manager.broadcastEval((bot: Client, guild: string) => !!bot.guilds.cache.get(guild), {
            guildId: guild,
            context: guild
        });
        res.send({ isinuguild });
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
        console.log(options)
        let vote: string;

        switch (options.type) {
            case "new_bot_bump":
                manager.broadcastEval((bot: Client, options: BcBotBumpAction) => {
                    bot.util.func.processBotBump(options);
                }, {
                    cluster: 0,
                    context: options
                });
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