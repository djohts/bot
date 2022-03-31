import { FastifyInstance, HookHandlerDoneFunction } from "fastify";
import { Guild, Permissions, ShardClientUtil } from "discord.js";
import { manager } from "../../sharding";
import { ModifiedClient, SessionUser } from "../../constants/types";

export = (fastify: FastifyInstance, _: any, done: HookHandlerDoneFunction) => {
    fastify.get("/", (req, res): any => res.redirect("/dash/guilds"));
    fastify.get("/guild/:id", async (req: any, res) => {
        const id = req.params.id;
        const user = req.session.user as SessionUser | null;
        if (
            !id ||
            !user ||
            !new Permissions().add(user.guilds.find((guild) => guild.id === id).permissions as any).has("ADMINISTRATOR")
        ) return res.redirect("/dash/guilds");
        const guild: Guild | null = await manager.broadcastEval((bot: ModifiedClient, { id }) => {
            const { inspect } = require("util");
            const guild = bot.guilds.cache.get(id);
            console.log(id, guild)
            return guild ? inspect(guild) : null;
        }, {
            shard: ShardClientUtil.shardIdForGuildId(id, manager.shards.size),
            context: { id }
        });
        if (!guild) {
            return res.redirect(`/api/invite/${id}`);
        };
        res.send(guild);
    });
    fastify.get("/guilds", async (req: any, res) => {
        req.session.lastPage = "/dash/guilds";

        if (!req.session.user) return res.redirect("/api/login");

        res.view("dash/guilds.ejs", { user: req.session.user });
    });
    done();
};