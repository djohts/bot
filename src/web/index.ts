import config from "../../config";
import pov from "@fastify/view";
import fastify from "fastify";
import ejs from "ejs";

export = () => {
    const app = fastify();
    app.register(pov, {
        engine: { ejs },
        root: __dirname + "/views/"
    });

    app.register(require("./routes/api"), { prefix: "/api" });
    app.register(require("./routes/util"), { prefix: "/util" });
    app.register(require("./routes/root"), { prefix: "/" });

    app.listen({ port: config.port, host: "0.0.0.0" });
};