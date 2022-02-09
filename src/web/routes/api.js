const config = require("../../../config");
const discordoauth2 = require("discord-oauth2");
const { ShardingManager } = require("discord.js");
const oauth2 = new discordoauth2({
    clientId: config.client.id,
    clientSecret: config.client.secret,
    redirectUri: config.redirectUri
});

module.exports = (fastify, _, done) => {
    fastify.get("/shards", async (_, res) => {
        const manager = require("../index").sharding;
        const newBotInfo = await manager.broadcastEval((bot) => ({
            status: bot.ws.status,
            guilds: bot.guilds.cache.size,
            cachedUsers: bot.users.cache.size,
            users: bot.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0),
            ping: bot.ws.ping,
            loading: bot.loading
        })).then((results) => results.reduce((info, next, index) => {
            for (const [key, value] of Object.entries(next)) {
                if (["guilds", "cachedUsers", "users"].includes(key)) info[key] = (info[key] || 0) + value;
            };
            info.shards[index] = next;
            return info;
        }, { shards: {} }));
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

        if (!a.access_token?.length) return res.redirect("/api/login");

        const user = await oauth2.getUser(a.access_token);
        req.session.user = user;
        res.redirect(req.session.lastPage);
    });

    fastify.get("/user/guilds", async (req, res) => {
        const { sharding } = require("../index");
        if (!(sharding instanceof ShardingManager)) return;

        const { user } = req.session;
        if (!user) return res.status(401).send();

        const allGuilds = await sharding.broadcastEval((bot, { userId }) => bot.guilds.cache.filter(async (g) => {
            const member = await g.members.fetch(userId).then(() => true).catch(() => false);
            return member;
        }).map((g) => g), { context: { userId: user.id } }).then((a) => a.flat().map((guild) => ({
            id: guild.id,
            name: guild.name,
            iconUrl: guild.icon
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                : "https://cdn.iconscout.com/icon/free/png-256/discord-3215389-2673807.png"
        })));
        const managedGuilds = await sharding.broadcastEval((bot, { userId }) => bot.guilds.cache.filter(async (g) => {
            const member = await g.members.fetch(userId).then((m) => m.permissions.has("ADMINISTRATOR")).catch(() => false);
            return member;
        }).map((g) => g), { context: { userId: user.id } }).then((a) => a.flat().map((guild) => ({
            id: guild.id,
            name: guild.name,
            iconUrl: guild.icon
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                : "https://cdn.iconscout.com/icon/free/png-256/discord-3215389-2673807.png"
        })));

        res.send({ allGuilds, managedGuilds });
    });
    done();
};