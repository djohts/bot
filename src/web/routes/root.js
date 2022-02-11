const fs = require("fs");

module.exports = (fastify, _, done) => {
    fastify.get("/", (req, res) => {
        req.session.lastPage = "/";
        res.view("index.ejs", { user: req.session.user });
    });
    fastify.get("/stats", (req, res) => {
        req.session.lastPage = "/stats";
        res.view("stats.ejs", { user: req.session.user });
    });
    fastify.get("/favicon.ico", async (req, res) => {
        const stream = fs.createReadStream(__dirname + "/../views/favicon.ico");
        res.send(stream);
    });
    done();
};