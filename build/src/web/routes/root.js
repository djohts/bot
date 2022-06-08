"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_1 = __importDefault(require("fs"));
module.exports = (fastify, _, done) => {
    fastify.get("/", (req, res) => {
        req.session.lastPage = "/";
        res.view("index.ejs", { user: req.session.user });
    });
    fastify.get("/stats", (req, res) => {
        req.session.lastPage = "/stats";
        res.view("stats.ejs", { user: req.session.user });
    });
    fastify.get("/tos", (req, res) => {
        res.view("tos.ejs", { user: req.session.user });
    });
    fastify.get("/pp", (req, res) => {
        res.view("pp.ejs", { user: req.session.user });
    });
    fastify.get("/favicon.ico", async (req, res) => {
        const stream = fs_1.default.readFileSync(__dirname + "/../views/favicon.ico");
        res.send(stream);
    });
    done();
};
