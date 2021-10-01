const Discord = require("discord.js");
const config = require("../config");
const { prefix } = require("../config");
const commandHandler = require("./handlers/commands");
const slashHandler = require("./handlers/interactions/slash");
const client = new Discord.Client({
    makeCache: Discord.Options.cacheWithLimits({
        MessageManager: {
            maxSize: 1,
            sweepInterval: 10
        }
    }),
    intents: [
        "GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS", "GUILD_PRESENCES"
    ],
    presence: {
        status: "dnd",
        activity: {
            type: "WATCHING",
            name: "загрузочный экран"
        }
    }
});
const log = require("./handlers/logger");
const db = require("./database/")();
const { deleteMessage, checkMutes } = require("./handlers/utils");

global.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
global.msToTime = require("./constants/").msToTime;
global.parse = require("./constants/").parseTime;
module.exports.client = client;
global.delMsg = deleteMessage;
global.client = client;
global.log = log;
global.db = db;

let shard = "[Shard N/A]";

client.once("shardReady", async (shardid, unavailable = new Set()) => {
    shard = `[Shard ${shardid}]`;
    log.log(`${shard} Ready as ${client.user.tag}! Caching guilds.`);

    client.loading = true;

    let disabledGuilds = new Set([...Array.from(unavailable), ...client.guilds.cache.map(guild => guild.id)]);
    let guildCachingStart = Date.now();

    await db.cacheGuilds(disabledGuilds);
    log.log(`${shard} All ${disabledGuilds.size} guilds have been cached. [${Date.now() - guildCachingStart}ms]`);

    disabledGuilds.size = 0;

    slashHandler(client, shard);

    client.loading = false;

    await updatePresence();
    setInterval(updatePresence, 60 * 1000); // 1 minute
    await checkMutes(client);
    setInterval(() => checkMutes(client), 5 * 1000);
});

client.on("messageCreate", async (message) => {
    if (
        !message.guild ||
        message.author.bot ||
        message.type != "DEFAULT"
    ) return;
    const gdb = await db.guild(message.guild.id);

    if (gdb.get().mutes[message.author.id] && gdb.get().settings.delMuted) return deleteMessage(message);
    if (gdb.get().mutes[message.author.id]) return;

    global.gdb = gdb;
    global.gldb = await db.global;
    if (message.content.startsWith(prefix) || message.content.match(`^<@!?${client.user.id}> `)) return commandHandler(message, prefix, gdb, db);
    if (message.content.match(`^<@!?${client.user.id}>`)) return message.react("👋").catch();
});

const { plurify } = require("./constants/");
const updatePresence = async () => {
    let name = `тикток фм`;
    return client.user.setPresence({
        status: "idle",
        activities: [{ type: "LISTENING", name }]
    });
};

client.on("error", err => log.error(`${shard} Client error. ${err}`));
client.on("rateLimit", rateLimitInfo => log.warn(`${shard} Rate limited.\n${JSON.stringify(rateLimitInfo)}`));
client.on("shardDisconnected", closeEvent => log.warn(`${shard} Disconnected. ${closeEvent}`));
client.on("shardError", err => log.error(`${shard} Error. ${err}`));
client.on("shardReconnecting", () => log.log(`${shard} Reconnecting.`));
client.on("shardResume", (_, replayedEvents) => log.log(`${shard} Resumed. ${replayedEvents} replayed events.`));
client.on("warn", info => log.warn(`${shard} Warning. ${info}`));
client.login(config.token);

process.on("unhandledRejection", rej => log.error(rej.stack));
process.on("SIGINT", () => process.exit());