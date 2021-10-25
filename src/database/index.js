const config = require(__dirname + "/../../config"), mongoose = require("mongoose");

module.exports = () => {
    mongoose.connect(config.database_uri, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useCreateIndex: true,
        useUnifiedTopology: true
    }).catch(e => {
        console.error(e.stack);
        client.shard.send("respawn");
    });

    return {
        guild: require(__dirname + "/guild")(),
        cacheGuilds: require(__dirname + "/guild").cacheAll,
        global: require(__dirname + "/global")
    };
};