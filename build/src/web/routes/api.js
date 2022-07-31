"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const config_1 = __importDefault(require("../../../config"));
const discord_oauth2_1 = __importDefault(require("discord-oauth2"));
const sharding_1 = require("../../sharding");
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
const wh = new discord_js_1.WebhookClient({ url: config_1.default.notifications_webhook });
const oauth2 = new discord_oauth2_1.default({
    clientId: config_1.default.client.id,
    clientSecret: config_1.default.client.secret,
    redirectUri: config_1.default.redirectUri
});
const isdev = !config_1.default.monitoring.bc;
function prometheusMetrics(obj) {
    const metrics = [];
    for (let [key, value] of Object.entries(obj)) {
        if (isdev)
            key = `d${key}`;
        const prefix = [
            `# HELP ${key} todo`,
            `# TYPE ${key} gauge`
        ].join("\n");
        metrics.push(prefix);
        if (typeof value === "number") {
            metrics.push(`${key} ${value}`);
        }
        else {
            for (const subkey in value) {
                metrics.push(`${key}{subkey="${subkey}",} ${value[subkey]}`);
            }
            ;
        }
        ;
    }
    ;
    return metrics.join("\n");
}
;
module.exports = (fastify, _, done) => {
    fastify.get("/shards", async (_, res) => {
        const newBotInfo = await sharding_1.manager.broadcastEval((bot) => ({
            status: bot.ws.status,
            guilds: bot.guilds.cache.size,
            cachedUsers: bot.users.cache.size,
            channels: bot.channels.cache.size,
            users: bot.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0),
            ping: bot.ws.ping,
            loading: bot.loading
        })).then((results) => results.reduce((info, next, index) => {
            for (const [key, value] of Object.entries(next)) {
                if (["guilds", "cachedUsers", "channels", "users"].includes(key))
                    info[key] = (info[key] || 0) + value;
            }
            ;
            info.shards[index] = next;
            return info;
        }, {
            shards: {},
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
        const sharddata = (await (0, axios_1.default)("http://localhost:4000/api/shards").then((response) => response.data));
        const metricObject = {
            total_guilds: sharddata.guilds,
            total_channels: sharddata.channels,
            total_users: sharddata.users,
            total_cached_users: sharddata.cachedUsers,
            average_ping: Object.values(sharddata.shards).reduce((total, next) => total + next.ping, 0) / Object.keys(sharddata.shards).length,
            shard_guilds: {},
            shard_channels: {},
            shard_users: {},
            shard_cached_users: {},
            shard_ping: {},
        };
        for (const [key, value] of Object.entries(sharddata.shards)) {
            metricObject["shard_guilds"][key] = value.guilds;
            metricObject["shard_channels"][key] = value.channels;
            metricObject["shard_users"][key] = value.users;
            metricObject["shard_cached_users"][key] = value.cachedUsers;
            metricObject["shard_ping"][key] = value.ping;
        }
        ;
        res.type("text/plain");
        res.send(prometheusMetrics(metricObject));
    });
    fastify.get("/login", (_, res) => {
        res.redirect(oauth2.generateAuthUrl({
            scope: ["identify", "guilds"],
            responseType: "code",
        }));
    });
    fastify.get("/logout", (req, res) => {
        req.session.user = null;
        res.redirect(req.session.lastPage);
    });
    fastify.get("/authorize", async (req, res) => {
        const a = await oauth2.tokenRequest({
            code: req.query.code,
            scope: ["identify", "guilds"],
            grantType: "authorization_code"
        }).catch(() => res.redirect(req.session.lastPage));
        if (!a.access_token)
            return res.redirect("/api/login");
        const user = await oauth2.getUser(a.access_token);
        req.session.user = user;
        req.session.user.guilds = await oauth2.getUserGuilds(a.access_token);
        res.redirect(req.session.lastPage);
    });
    fastify.get("/user/guilds", (req, res) => {
        const user = req.session.user;
        if (!user)
            return res.redirect("/api/login");
        const guilds = [];
        user.guilds.map((rawguild) => {
            guilds.push({
                id: rawguild.id,
                name: rawguild.name,
                iconUrl: rawguild.icon ? `https://cdn.discordapp.com/icons/${rawguild.id}/${rawguild.icon}.png` : null,
                managed: new discord_js_1.PermissionsBitField().add(rawguild.permissions).has(discord_js_1.PermissionFlagsBits.Administrator)
            });
        });
        res.send(guilds);
    });
    fastify.get("/bot/isinuguild/:guild", async (req, res) => {
        const { guild } = req.params;
        if (!guild)
            return res.send({ isinuguild: false });
        const isinuguild = await sharding_1.manager.broadcastEval((bot, guild) => !!bot.guilds.cache.get(guild), {
            shard: discord_js_1.ShardClientUtil.shardIdForGuildId(guild, sharding_1.manager.shards.size),
            context: guild
        });
        res.send({ isinuguild });
    });
    fastify.get("/invite/:guildid", (req, res) => {
        const guildid = req.params.guildid;
        const botid = config_1.default.client.id;
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
        if (req.headers["x-hook-key"] !== config_1.default.monitoring.bc_hook_key)
            return res.status(403).send();
        const options = req.body;
        switch (options.type) {
            case "new_bot_bump":
                sharding_1.manager.broadcastEval((bot, options) => {
                    bot.util.func.processBotBump(options);
                }, {
                    shard: discord_js_1.ShardClientUtil.shardIdForGuildId("888870095659630664", sharding_1.manager.shards.size),
                    context: options
                });
                break;
            case "new_bot_comment":
                await wh.send({
                    embeds: [{
                            title: "Новый комментарий",
                            description: [
                                `<@${options.data.user}>:`,
                                options.data.comment.new
                            ].join("\n"),
                            fields: [{
                                    name: "Оценка",
                                    value: !options.data.comment.vote.new
                                        ? "Нейтральная" : options.data.comment.vote.new === 1
                                        ? "Позитивная" : "Негативная"
                                }]
                        }],
                    username: "ботикорд"
                });
                break;
            case "edit_bot_comment":
                let vote;
                if (options.data.comment.vote.new == 1)
                    vote = "Позитивная";
                else if (options.data.comment.vote.new == -1)
                    vote = "Негативная";
                else
                    vote = "Нейтральная";
                await wh.send({
                    embeds: [{
                            title: "Комментарий изменён",
                            description: [
                                `<@${options.data.user}>:`,
                                options.data.comment.new
                            ].join("\n"),
                            fields: [{
                                    name: "Оценка",
                                    value: vote
                                }]
                        }],
                    username: "ботикорд"
                });
                break;
        }
        ;
        return res.status(202).send();
    });
    done();
};
