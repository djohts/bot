import config from "../../config";
import mongoose from "mongoose";

import { cacheGuilds } from "./guild";
import { cacheGSets } from "./gset";
import global from "./global";
import settings from "./gset";
import guild from "./guild";
import users from "./users";

export = {
    connection: mongoose.connect(config.database_uri),

    guild: guild(),
    settings: settings(),
    users: users(),
    global: global(),
    cacheGuilds: cacheGuilds,
    cacheGSets: cacheGSets
};