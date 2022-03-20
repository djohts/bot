"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const config_1 = __importDefault(require("../../../config"));
const discord_oauth2_1 = __importDefault(require("discord-oauth2"));
const sharding_1 = require("../../sharding");
const oauth2 = new discord_oauth2_1.default({
    clientId: config_1.default.client.id,
    clientSecret: config_1.default.client.secret,
    redirectUri: config_1.default.redirectUri
});
module.exports = (fastify, _, done) => {
    fastify.get("/shards", async (_, res) => {
        const newBotInfo = await sharding_1.manager.broadcastEval((bot) => ({
            status: bot.ws.status,
            guilds: bot.guilds.cache.size,
            cachedUsers: bot.users.cache.size,
            users: bot.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0),
            ping: bot.ws.ping,
            loading: bot.loading
        })).then((results) => results.reduce((info, next, index) => {
            for (const [key, value] of Object.entries(next)) {
                if (["guilds", "cachedUsers", "users"].includes(key))
                    info[key] = (info[key] || 0) + value;
            }
            ;
            info.shards[index] = next;
            return info;
        }, { shards: {}, lastUpdate: 0 }));
        newBotInfo.lastUpdate = Date.now();
        res.send(newBotInfo);
    });
    fastify.get("/login", (_, res) => res.redirect(oauth2.generateAuthUrl({
        scope: ["identify", "guilds"],
        responseType: "code",
    })));
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
        res.redirect(req.session.lastPage);
    });
    fastify.get("/user/guilds", async (req, res) => {
        return res.status(423).send();
        const sharding = require("../../sharding").manager;
        const { user } = req.session;
        if (!user)
            return res.status(401).send();
        // @ts-ignore
        const allGuilds = await sharding.broadcastEval((bot, { userId }) => bot.guilds.cache.filter(async (g) => {
            //const member = await g.members.fetch(userId).then(() => true).catch(() => false);
            return g.members.cache.has(userId);
            // @ts-ignore
        }).map((g) => g), { context: { userId: user.id } }).then((a) => a.flat().map((guild) => ({
            // @ts-ignore
            id: guild.id,
            // @ts-ignore
            name: guild.name,
            // @ts-ignore
            iconUrl: guild.icon
                // @ts-ignore
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                : "https://cdn.iconscout.com/icon/free/png-256/discord-3215389-2673807.png"
        })));
        // @ts-ignore
        const managedGuilds = await sharding.broadcastEval((bot, { userId }) => bot.guilds.cache.filter(async (g) => {
            //const member = await g.members.fetch(userId).then((m) => m.permissions.has("ADMINISTRATOR")).catch(() => false);
            return g.members.cache.get(userId)?.permissions.has("ADMINISTRATOR");
            // @ts-ignore
        }).map((g) => g), { context: { userId: user.id } }).then((a) => a.flat().map((guild) => ({
            // @ts-ignore
            id: guild.id,
            // @ts-ignore
            name: guild.name,
            // @ts-ignore
            iconUrl: guild.icon
                // @ts-ignore
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                : "https://cdn.iconscout.com/icon/free/png-256/discord-3215389-2673807.png"
        })));
        res.send({ allGuilds, managedGuilds });
    });
    done();
};
