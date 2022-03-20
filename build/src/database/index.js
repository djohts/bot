"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const config_1 = __importDefault(require("../../config"));
const mongoose_1 = __importDefault(require("mongoose"));
const guild_1 = __importDefault(require("./guild"));
const gset_1 = __importDefault(require("./gset"));
const global_1 = __importDefault(require("./global"));
const guild_2 = require("./guild");
const gset_2 = require("./gset");
module.exports = {
    connection: mongoose_1.default.connect(config_1.default.database_uri),
    guild: (0, guild_1.default)(),
    settings: (0, gset_1.default)(),
    cacheGuilds: guild_2.cacheGuilds,
    cacheGSets: gset_2.cacheGSets,
    global: global_1.default
};
