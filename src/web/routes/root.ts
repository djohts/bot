import { FastifyInstance, HookHandlerDoneFunction } from "fastify";
import { createReadStream } from "node:fs";

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
    fastify.get("/favicon.ico", (req, res) => res.send(createReadStream(__dirname + "/../views/favicon.ico")));
    done();
};