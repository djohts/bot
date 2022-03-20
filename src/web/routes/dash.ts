import { FastifyInstance, HookHandlerDoneFunction } from "fastify";

export = (fastify: FastifyInstance, _: any, done: HookHandlerDoneFunction) => {
    fastify.get("/", (req, res): any => res.redirect("/dashboard/guilds"));
    fastify.get("/guilds", async (req: any, res) => {
        req.session.lastPage = "/dashboard/guilds";

        if (!req.session.user) return res.redirect("/api/login");

        res.view("dash/guilds.ejs", { user: req.session.user });
    });
    done();
};