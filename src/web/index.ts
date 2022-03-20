import { FastifyInstance } from "fastify";
import config from "../../config";
import fastify from "fastify";
import fastifySession from "fastify-session";
import fastifyCookie from "fastify-cookie";
import pov from "point-of-view"

export = () => {
    const app: FastifyInstance = fastify();
    app.register(fastifyCookie);
    app.register(fastifySession, {
        secret: config.secretsomething,
        cookie: {
            secure: false,
            sameSite: false,
            maxAge: 2 * 60 * 60 * 1000
        }
    });
    app.register(pov, {
        engine: {
            ejs: require("ejs")
        },
        root: __dirname + "/views/"
    });
    app.addHook("preHandler", (req, _, next) => {
        (req as any).session.lastPage = (req as any).session.lastPage || "/";
        next();
    });

    app.register(require("./routes/api"), { prefix: "/api" });
    app.register(require("./routes/util"), { prefix: "/util" });
    app.register(require("./routes/dash"), { prefix: "/dashboard" });
    app.register(require("./routes/root"), { prefix: "/" });

    app.listen(config.port, "0.0.0.0");
};