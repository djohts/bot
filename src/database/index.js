const config = require("../../config"), mongoose = require("mongoose");

module.exports = () => {
    mongoose.connect(config.database_uri).catch(() => {
        client.shard.send("respawn");
    });

    return {
        guild: require("./guild")(),
        settings: require("./gset")(),
        cacheGuilds: require("./guild").cacheAll,
        cacheGSets: require("./gset").cacheAll,
        global: require("./global")
    };
};