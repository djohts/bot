const Discord = require("discord.js");
const config = require("../config");
const { prefix } = require("../config");
const commandHandler = require("./handlers/commands");
const slashHandler = require("./handlers/interactions/slash");
const client = new Discord.Client({
    makeCache: Discord.Options.cacheWithLimits({
        ReactionManager: {
            maxSize: 0
        },
        MessageManager: {
            maxSize: 200,
            sweepInterval: 600
        }
    }),
    intents: [
        Discord.Intents.FLAGS.GUILDS
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

global.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
global.getInvite = require("./constants/").getInvite;
global.msToTime = require("./constants/").msToTime;
global.plurify = require("./constants/").plurify;
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
    setInterval(updatePresence, 10000); // 10 seconds
});

client.on("message", async message => {
    global.msg = message;

    if (
        !message.guild ||
        message.author.bot ||
        message.type !== "DEFAULT"
    ) return;

    const gdb = await db.guild(message.guild.id);
    global.gdb = gdb;

    let { prefix } = gdb.get();
    if (!prefix.length) prefix = config.prefix;

    if (message.content.startsWith(prefix) || message.content.match(`^<@!?${client.user.id}> `)) return commandHandler(message, prefix, gdb, db);
    if (message.content.match(`^<@!?${client.user.id}>`)) return message.reply(`👋 Мой префикс на этом сервере \`${prefix}\`, для помощи напишите \`${prefix}help\`.`);
});

const updatePresence = async () => {
    let guildCount = await client.shard.broadcastEval(bot => bot.guilds.cache.size).then(res => res.reduce((prev, val) => prev + val, 0));

    let name = `${prefix}help • ${plurify(guildCount, "сервер")}`;
    return client.user.setPresence({
        status: "online",
        activity: { type: "WATCHING", name }
    });
};

client
    .on("error", err => log.error(`${shard} Client error. ${err}`))
    .on("rateLimit", rateLimitInfo => log.warn(`${shard} Rate limited.\n${JSON.stringify(rateLimitInfo)}`))
    .on("shardDisconnected", closeEvent => log.warn(`${shard} Disconnected. ${closeEvent}`))
    .on("shardError", err => log.error(`${shard} Error. ${err}`))
    .on("shardReconnecting", () => log.log(`${shard} Reconnecting.`))
    .on("shardResume", (_, replayedEvents) => log.log(`${shard} Resumed. ${replayedEvents} replayed events.`))
    .on("warn", info => log.warn(`${shard} Warning. ${info}`))
    .login(config.token);

process.on("unhandledRejection", rej => log.error(rej.stack));