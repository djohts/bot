import config from "../../config";
import mongoose from "mongoose";

import guild from "./guild";
import settings from "./gset";
import global from "./global";
import { cacheGuilds } from "./guild";
import { cacheGSets } from "./gset";

export = {
    connection: mongoose.connect(config.database_uri),

    guild: guild(),
    settings: settings(),
    cacheGuilds: cacheGuilds,
    cacheGSets: cacheGSets,
    global: global
};