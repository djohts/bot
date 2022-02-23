require("nodejs-better-console").overrideConsole();
const fs = require("fs");
const Discord = require("discord.js");
const config = require("../config");
const prettyms = require("pretty-ms");
const interactionHandler = require("./handlers/interactions/");
const lavaHandler = require("./handlers/lava");
const prepareGuild = require("./handlers/prepareGuilds");
const tickers = require("./handlers/tickers");
const client = new Discord.Client({
    makeCache: Discord.Options.cacheWithLimits({
        MessageManager: {
            sweepInterval: 600,
            maxSize: 2048,
            keepOverLimit: (m) => m.author.id == m.client.user.id,
            sweepFilter: Discord.LimitedCollection.filterByLifetime({
                lifetime: 2 * 24 * 60 * 60 // 2 days
            })
        }
    }),
    intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS", "GUILD_BANS", "GUILD_VOICE_STATES"],
    presence: {
        status: "dnd",
        activities: [{
            type: "WATCHING",
            name: "the loading screen",
        }]
    }
});
const db = require("./database/")();
const { voicesJoin, voicesLeave, voicesSwitch } = require("./constants/callbacks");
require("discord-logs")(client);

global.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
global.parse = require("./constants/resolvers").parseTime;
global.prettyms = require("pretty-ms");
module.exports.client = client;
global.client = client;
global.db = db;

let shard = "[Shard N/A]";
const linkRates = new Map();
module.exports.linkRates = linkRates;
module.exports.shard = shard;
client.once("shardReady", async (shardId, unavailable = new Set()) => {
    let start = Date.now();
    client.shardId = shardId;
    shard = `[Shard ${shardId}]`;
    client.s = shard;

    client.loading = true;

    let slashPostStart = Date.now();
    require("./handlers/interactions/slash").registerCommands(client).then(() => {
        console.log(`${shard} Refreshed slash commands. [${prettyms(Date.now() - slashPostStart)}]`);
        interactionHandler(client);
    });

    console.log(`${shard} Ready as ${client.user.tag}! Caching guilds.`);

    let disabledGuilds = new Set([...Array.from(unavailable), ...client.guilds.cache.map((g) => g.id)]);
    let guildCachingStart = Date.now();

    await db.cacheGSets(disabledGuilds);
    await db.cacheGuilds(disabledGuilds);
    console.log(`${shard} All ${disabledGuilds.size} guilds have been cached. Processing available guilds. [${Date.now() - guildCachingStart}ms]`);

    disabledGuilds.forEach((id) => linkRates.set(id, new Set()));
    let processingStartTimestamp = Date.now(), completed = 0, presenceInterval = setInterval(() => client.user.setPresence({
        status: "idle",
        activities: [{
            type: "WATCHING",
            name: `${Math.floor((completed / client.guilds.cache.size) * 100)}%`
        }]
    }), 1000);
    await Promise.all(client.guilds.cache.map(async (guild) => {
        await prepareGuild(guild, db);
        disabledGuilds.delete(guild.id);
        completed++;
    }));
    disabledGuilds = false;
    clearInterval(presenceInterval);
    console.log(`${shard} All ${client.guilds.cache.size} available guilds have been processed. [${Date.now() - processingStartTimestamp}ms]`);

    tickers(client);

    client.loading = false;
    console.log(`${shard} Ready in ${prettyms(Date.now() - start)}`);

    client.manager = lavaHandler(client);
    client.on("raw", (d) => client.manager.updateVoiceState(d));
});

const commandFiles = fs.readdirSync(__dirname + "/events/").filter((x) => x.endsWith(".js"));
commandFiles.forEach((filename) => {
    const file = require(`./events/${filename}`);
    if (file.once) {
        client.once(file.name, (...args) => file.run(client, ...args));
    } else {
        client.on(file.name, (...args) => file.run(client, ...args));
    };
});

client.on("voiceChannelJoin", voicesJoin);
client.on("voiceChannelLeave", voicesLeave);
client.on("voiceChannelSwitch", voicesSwitch);
client.on("error", (err) => console.error(`${shard} Client error. ${err}`));
client.on("rateLimit", (rateLimitInfo) => console.warn(`${shard} Rate limited.\n${JSON.stringify(rateLimitInfo)}`));
client.on("shardDisconnected", ({ code, reason }) => console.warn(`${shard} Disconnected. (${code} - ${reason})`));
client.on("shardError", (err) => console.error(`${shard} Error. ${err}`));
client.on("shardResume", (_, replayedEvents) => console.log(`${shard} Resumed. ${replayedEvents} replayed events.`));
client.on("warn", (info) => console.warn(`${shard} Warning. ${info}`));
client.login(config.token);

process.on("unhandledRejection", (rej) => console.error(rej));