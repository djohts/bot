import config from "../constants/config";
import fastify from "fastify";

export = () => {
    const app = fastify();

    app.register(require("./routes/api"), { prefix: "/api" });

    app.listen({ port: config.port, host: "0.0.0.0" });
};