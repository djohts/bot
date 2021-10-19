const config = require("../../config"), mongoose = require("mongoose");

module.exports = () => {
    mongoose.connect(config.database_uri, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useCreateIndex: true,
        useUnifiedTopology: true
    }).catch(e => {
        log.error(e.message + ": " + e.stack);
        client.shard.send("respawn");
    });

    return {
        guild: require("./guild")(), // guild(guildid)
        cacheGuilds: require("./guild").cacheAll,
        global: require("./global")
    };
};