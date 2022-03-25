"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const config_1 = __importDefault(require("../../config"));
const fastify_1 = __importDefault(require("fastify"));
const fastify_session_1 = __importDefault(require("fastify-session"));
const fastify_cookie_1 = __importDefault(require("fastify-cookie"));
const point_of_view_1 = __importDefault(require("point-of-view"));
module.exports = () => {
    const app = (0, fastify_1.default)();
    app.register(fastify_cookie_1.default);
    app.register(fastify_session_1.default, {
        secret: config_1.default.secretsomething,
        cookie: {
            secure: false,
            sameSite: false,
            maxAge: 2 * 60 * 60 * 1000
        }
    });
    app.register(point_of_view_1.default, {
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
    app.register(require("./routes/dash"), { prefix: "/dash" });
    app.register(require("./routes/root"), { prefix: "/" });
    app.listen(config_1.default.port, "0.0.0.0");
};
