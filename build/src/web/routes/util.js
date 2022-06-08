"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_1 = require("fs");
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
module.exports = (fastify, _, done) => {
    fastify.get("/:file", async (req, res) => res.send((0, fs_1.createReadStream)(`${__dirname}/../views/util/${(0, sanitize_filename_1.default)(req.params.file || "")}`)));
    done();
};
