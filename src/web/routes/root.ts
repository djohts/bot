import { FastifyInstance, HookHandlerDoneFunction } from "fastify";
import { createReadStream } from "node:fs";

export = (fastify: FastifyInstance, _: any, done: HookHandlerDoneFunction) => {
    fastify.get("/", (req: any, res) => {
        res.view("index.ejs");
    });
    fastify.get("/stats", (req: any, res) => {
        res.view("stats.ejs");
    });
    fastify.get("/tos", (req: any, res) => {
        res.view("tos.ejs");
    })
    fastify.get("/pp", (req: any, res) => {
        res.view("pp.ejs");
    })
    fastify.get("/favicon.ico", (req, res) => res.send(createReadStream(__dirname + "/../views/favicon.ico")));
    done();
};