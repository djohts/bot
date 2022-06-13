"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fastify_1 = __importDefault(require("fastify"));
const config_1 = __importDefault(require("../../config"));
const session_1 = __importDefault(require("@fastify/session"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const view_1 = __importDefault(require("@fastify/view"));
const ejs_1 = __importDefault(require("ejs"));
module.exports = () => {
    const app = (0, fastify_1.default)();
    app.register(cookie_1.default);
    app.register(session_1.default, {
        secret: config_1.default.secretsomething,
        cookie: {
            secure: false,
            sameSite: false,
            maxAge: 2 * 60 * 60 * 1000
        }
    });
    app.register(view_1.default, {
        engine: { ejs: ejs_1.default },
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
