const { ShardingManager } = require("discord.js");

module.exports = (fastify, _, done) => {
    fastify.get("/", (_, res) => res.redirect("/dashboard/guilds"));
    fastify.get("/guilds", async (req, res) => {
        const manager = require("../index").sharding;
        if (!(manager instanceof ShardingManager)) return;

        req.session.lastPage = "/dashboard/guilds";

        if (!req.session.user) return res.redirect("/api/login");

        res.view("dash/guilds.ejs", { user: req.session.user });
    });
    done();
};