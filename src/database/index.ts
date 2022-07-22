import config from "../../config";
import mongoose from "mongoose";

import guild from "./guild";
import settings from "./gset";
import users from "./users";
import global from "./global";
import { cacheGuilds } from "./guild";
import { cacheGSets } from "./gset";

export = {
    connection: mongoose.connect(config.database_uri),

    guild: guild(),
    settings: settings(),
    users: users(),
    global: global(),
    cacheGuilds: cacheGuilds,
    cacheGSets: cacheGSets
};