"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const config_1 = __importDefault(require("../../../config"));
const discord_oauth2_1 = __importDefault(require("discord-oauth2"));
const sharding_1 = require("../../sharding");
const discord_js_1 = require("discord.js");
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
        req.session.user.guilds = await oauth2.getUserGuilds(a.access_token);
        res.redirect(req.session.lastPage);
    });
    fastify.get("/user/guilds", async (req, res) => {
        const user = req.session.user;
        if (!user)
            return res.redirect("/api/login");
        const guilds = [];
        await Promise.all(user.guilds.map(async (rawguild) => {
            guilds.push({
                id: rawguild.id,
                name: rawguild.name,
                iconUrl: rawguild.icon ? `https://cdn.discordapp.com/icons/${rawguild.id}/${rawguild.icon}.png` : null,
                managed: new discord_js_1.Permissions().add(rawguild.permissions).has("ADMINISTRATOR")
            });
        }));
        res.send(guilds);
    });
    fastify.get("/bot/isinuguild/:guild", async (req, res) => {
        const guildid = req.params.guild;
        if (!guildid)
            return res.send({ isinuguild: false });
        const guild = await sharding_1.manager.broadcastEval((bot, { guildid }) => bot.guilds.cache.get(guildid) || null, {
            shard: discord_js_1.ShardClientUtil.shardIdForGuildId(guildid, sharding_1.manager.shards.size),
            context: { guildid }
        });
        if (!guild)
            return res.send({ isinuguild: false });
        res.send({ isinuguild: true });
    });
    fastify.get("/invite/:guildid", async (req, res) => {
        const guildid = req.params.guildid;
        const botid = config_1.default.client.id;
        guildid ? res.redirect([
            "https://discord.com/oauth2/authorize",
            `?client_id=${botid}`,
            `&guild_id=${guildid}`,
            "&disable_guild_select=true",
            "&scope=bot%20applications.commands",
            "&permissions=1375450033182"
        ].join("")) : res.redirect([
            "https://discord.com/oauth2/authorize",
            `?client_id=${botid}`,
            "&scope=bot%20applications.commands",
            "&permissions=1375450033182"
        ].join(""));
    });
    done();
};
