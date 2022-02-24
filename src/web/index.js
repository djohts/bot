const { ShardingManager } = require("discord.js");
const config = require("../../config");
const fastify = require("fastify").default;
const fastifySession = require("fastify-session").default;
const fastifyCookie = require("fastify-cookie").default;

module.exports = async (sharding) => {
    module.exports.sharding = sharding;
    if (!(sharding instanceof ShardingManager)) return;
    const app = fastify();
    app.register(fastifyCookie);
    app.register(fastifySession, {
        secret: config.secretsomething,
        cookie: {
            secure: false,
            sameSite: false,
            maxAge: 2 * 60 * 60 * 1000
        }
    });
    app.register(require("point-of-view"), {
        engine: {
            ejs: require("ejs")
        },
        root: __dirname + "/views/"
    });
    app.addHook("preHandler", (req, _, next) => {
        req.session.lastPage = req.session.lastPage || "/";
        next();
    });

    app.register(require("./routes/api"), { prefix: "/api" });
    app.register(require("./routes/util"), { prefix: "/util" });
    app.register(require("./routes/dash"), { prefix: "/dashboard" });
    app.register(require("./routes/root"), { prefix: "/" });

    app.listen(config.port, "0.0.0.0");
};