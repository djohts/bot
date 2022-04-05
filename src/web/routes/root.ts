import { FastifyInstance, HookHandlerDoneFunction } from "fastify";
import fs from "fs";

export = (fastify: FastifyInstance, _: any, done: HookHandlerDoneFunction) => {
    fastify.get("/", (req: any, res) => {
        req.session.lastPage = "/";
        res.view("index.ejs", { user: req.session.user });
    });
    fastify.get("/stats", (req: any, res) => {
        req.session.lastPage = "/stats";
        res.view("stats.ejs", { user: req.session.user });
    });
    fastify.get("/tos", (req: any, res) => {
        res.view("tos.ejs", { user: req.session.user });
    })
    fastify.get("/pp", (req: any, res) => {
        res.view("pp.ejs", { user: req.session.user });
    })
    fastify.get("/favicon.ico", async (req, res) => {
        const stream = fs.readFileSync(__dirname + "/../views/favicon.ico");
        res.send(stream);
    });
    done();
};