import { FastifyInstance, HookHandlerDoneFunction } from "fastify";
import { PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { manager } from "../../sharding";
import { SessionUser } from "../../constants/types";

export = (fastify: FastifyInstance, _: any, done: HookHandlerDoneFunction) => {
    fastify.get("/", (req, res): any => res.redirect("/dash/guilds"));
    fastify.get("/guild/:id", async (req: any, res) => {
        const id = req.params.id as string | undefined;
        const user = req.session.user as SessionUser | undefined;
        if (
            !id ||
            !user ||
            !new PermissionsBitField(user.guilds.find((guild) => guild.id === id)?.permissions || 0 as any).has(PermissionFlagsBits.Administrator)
        ) return res.redirect("/dash/guilds");
        const guild = await manager.broadcastEval((bot, id) => {
            const { inspect } = require("util");
            const guild = bot.guilds.cache.get(id);
            return inspect(guild) as string;
        }, {
            guildId: id,
            context: id
        });
        return console.log(guild);
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