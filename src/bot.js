const Discord = require("discord.js");
const config = require("../config");
const commandHandler = require("./handlers/commands");
const slashHandler = require("./handlers/interactions/slash");
const client = new Discord.Client({
    makeCache: Discord.Options.cacheWithLimits({
        BaseGuildEmojiManager: 0,
        GuildStickerManager: 0,
        GuildInviteManager: 0,
        GuildBanManager: 0,
        MessageManager: {
            sweepInterval: 30,
            keepOverLimit: (message) => message.author.id != message.client.user.id,
            sweepFilter: Discord.LimitedCollection.filterByLifetime({
                lifetime: 300
            })
        },
        GuildMemberManager: {
            sweepInterval: 30,
            sweepFilter: Discord.LimitedCollection.filterByLifetime({
                lifetime: 300,
                excludeFromSweep: (member) => member.user.id == member.client.user.id
            })
        }
    }),
    intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS", "GUILD_PRESENCES", "GUILD_BANS"],
    presence: {
        status: "dnd",
        activity: {
            type: "WATCHING",
            name: "загрузочный экран",
        }
    }
});
const log = require("./handlers/logger");
const db = require("./database/")();
const { deleteMessage, checkMutes, checkBans } = require("./handlers/utils");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const rest = new REST({ version: "9" }).setToken(config.token);

global.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
global.parseImage = require("./handlers/utils").parseImage;
global.msToTime = require("./constants/").msToTime;
global.parse = require("./constants/").parseTime;
module.exports.client = client;
global.delMsg = deleteMessage;
global.client = client;
global.log = log;
global.db = db;

let shard = "[Shard N/A]";

client.once("shardReady", async (shardid, unavailable = new Set()) => {
    client.shardId = shardid;
    shard = `[Shard ${shardid}]`;
    log.log(`${shard} Ready as ${client.user.tag}! Caching guilds.`, {
        title: shard,
        description: `\`\`\`\nReady as ${client.user.tag}! Caching guilds.\n\`\`\``,
    });

    client.loading = true;

    let disabledGuilds = new Set([...Array.from(unavailable), ...client.guilds.cache.map((guild) => guild.id)]);
    let guildCachingStart = Date.now();

    await db.cacheGuilds(disabledGuilds);
    log.log(`${shard} All ${disabledGuilds.size} guilds have been cached. [${Date.now() - guildCachingStart}ms]`, {
        title: shard,
        description: `\`\`\`\nAll ${disabledGuilds.size} guilds have been cached. [${Date.now() - guildCachingStart}ms]\n\`\`\``,
    });

    disabledGuilds.size = 0;

    slashHandler(client, shard);

    client.loading = false;

    await updatePresence();
    setInterval(updatePresence, 10 * 60 * 1000); // 10 minutes

    await checkMutes(client);
    setInterval(() => checkMutes(client), 3 * 1000); // 3 seconds

    await checkBans(client);
    setInterval(() => checkBans(client), 5 * 1000); // 5 seconds
});

client.on("messageCreate", async (message) => {
    if (
        !message.guild ||
        message.author.bot
    ) return;
    const gdb = await db.guild(message.guild.id);

    if (gdb.get().mutes[message.author.id] && gdb.get().settings.delMuted) return deleteMessage(message);
    if (gdb.get().mutes[message.author.id]) return;

    global.gdb = gdb;
    global.gldb = await db.global;
    if (message.content.startsWith(config.prefix) || message.content.match(`^<@!?${client.user.id}> `)) return commandHandler(message, config.prefix, gdb, db);
    if (message.content.match(`^<@!?${client.user.id}>`)) return message.react("👋").catch(() => { });
});

const updatePresence = async () => {
    let name = `тикток фм`;
    return client.user.setPresence({
        status: "idle",
        activities: [{ type: "LISTENING", name }],
    });
};

client.on("guildCreate", async (guild) => {
    await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: client.slashes }).catch(() => { });
});

client.on("error", (err) => log.error(`${shard} Client error. ${err}`, {
    title: shard,
    description: `Client error. ${err}`
}));
client.on("rateLimit", (rateLimitInfo) => log.warn(`${shard} Rate limited.\n${JSON.stringify(rateLimitInfo)}`, {
    title: shard,
    description: `Rate limited.\n${JSON.stringify(rateLimitInfo)}`
}));
client.on("shardDisconnected", (closeEvent) => log.warn(`${shard} Disconnected. ${closeEvent}`, {
    title: shard,
    description: `Disconnected. ${closeEvent}`
}));
client.on("shardError", (err) => log.error(`${shard} Error. ${err}`, {
    title: shard,
    description: `Error. ${err}`
}));
client.on("shardReconnecting", () => log.log(`${shard} Reconnecting.`, {
    title: shard,
    description: `Reconnecting.`
}));
client.on("shardResume", (_, replayedEvents) => log.log(`${shard} Resumed. ${replayedEvents} replayed events.`, {
    title: shard,
    description: `Resumed. ${replayedEvents} replayed events.`
}));
client.on("warn", (info) => log.warn(`${shard} Warning. ${info}`), {
    title: shard,
    description: `Warning. ${info}`
});
client.login(config.token);

process.on("unhandledRejection", (rej) => log.error(rej.message + "\n" + rej.stack));
process.on("SIGINT", () => process.exit());
