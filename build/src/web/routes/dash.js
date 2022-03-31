"use strict";
const discord_js_1 = require("discord.js");
const sharding_1 = require("../../sharding");
module.exports = (fastify, _, done) => {
    fastify.get("/", (req, res) => res.redirect("/dash/guilds"));
    fastify.get("/guild/:id", async (req, res) => {
        const id = req.params.id;
        const user = req.session.user;
        if (!id ||
            !user ||
            !new discord_js_1.Permissions().add(user.guilds.find((guild) => guild.id === id)?.permissions || "0").has("ADMINISTRATOR"))
            return res.redirect("/dash/guilds");
        const guild = await sharding_1.manager.broadcastEval((bot, { id }) => {
            const { inspect } = require("util");
            const guild = bot.guilds.cache.get(id);
            console.log(id, guild);
            return guild ? inspect(guild) : null;
        }, {
            shard: discord_js_1.ShardClientUtil.shardIdForGuildId(id, sharding_1.manager.shards.size),
            context: { id }
        });
        if (!guild) {
            return res.redirect(`/api/invite/${id}`);
        }
        ;
        res.send(guild);
    });
    fastify.get("/guilds", async (req, res) => {
        req.session.lastPage = "/dash/guilds";
        if (!req.session.user)
            return res.redirect("/api/login");
        res.view("dash/guilds.ejs", { user: req.session.user });
    });
    done();
};
