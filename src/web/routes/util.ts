import { HookHandlerDoneFunction } from "fastify";
import { FastifyInstance } from "fastify";
import { createReadStream } from "node:fs";
import sanitize from "sanitize-filename";

export = (fastify: FastifyInstance, _: any, done: HookHandlerDoneFunction) => {
    fastify.get("/:file", (req: any, res) => res.send(createReadStream(`${__dirname}/../views/util/${sanitize(req.params.file || "")}`)));
    done();
};