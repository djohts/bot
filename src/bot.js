require("nodejs-better-console").overrideConsole();
const Discord = require("discord.js");
const config = require("../config");
const commandHandler = require("./handlers/commands");
const interactionHandler = require("./handlers/interactions/");
const client = new Discord.Client({
    makeCache: Discord.Options.cacheWithLimits({
        BaseGuildEmojiManager: 0,
        GuildStickerManager: 0,
        GuildInviteManager: 0,
        GuildEmojiManager: 0,
        GuildBanManager: {
            sweepInterval: 10,
            sweepFilter: Discord.LimitedCollection.filterByLifetime({
                lifetime: 5
            })
        },
        MessageManager: {
            sweepInterval: 60,
            maxSize: 100,
            keepOverLimit: (message) => message.author.id != message.client.user.id,
            sweepFilter: Discord.LimitedCollection.filterByLifetime({
                lifetime: 300
            })
        }
    }),
    intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS", "GUILD_PRESENCES", "GUILD_BANS", "GUILD_VOICE_STATES"],
    presence: {
        status: "dnd",
        activity: {
            type: "WATCHING",
            name: "загрузочный экран",
        }
    }
});
const db = require("./database/")();
const { deleteMessage, checkMutes, checkBans } = require("./handlers/utils");
const { voicesJoin, voicesLeave, voicesSwitch } = require("./constants/callbacks");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const rest = new REST({ version: "9" }).setToken(config.token);
require("discord-logs")(client);

global.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
global.parse = require("./constants/resolvers").parseTime;
global.msToTime = require("./constants/time").msToTime;
module.exports.client = client;
global.client = client;
global.db = db;

let shard = "[Shard N/A]";

client.once("shardReady", async (shardId, unavailable = new Set()) => {
    client.shardId = shardId;
    shard = `[Shard ${shardId}]`;
    console.log(`${shard} Ready as ${client.user.tag}! Caching guilds.`);

    client.loading = true;

    let disabledGuilds = new Set([...Array.from(unavailable), ...client.guilds.cache.map((guild) => guild.id)]);
    let guildCachingStart = Date.now();

    await db.cacheGSets(disabledGuilds);
    await db.cacheGuilds(disabledGuilds);
    console.log(`${shard} All ${disabledGuilds.size} guilds have been cached. [${Date.now() - guildCachingStart}ms]`);
    await checkBans(client);
    await checkMutes(client);

    disabledGuilds = false;

    await interactionHandler(client);

    await require("./handlers/interactions/slash").registerCommands(client);
    console.log(`${shard} Refreshed slash commands.`);

    client.loading = false;

    await updatePresence();
    setInterval(updatePresence, 60 * 1000); // 1 minute

    setInterval(() => checkMutes(client), 3 * 1000); // 3 seconds
    setInterval(() => checkBans(client), 5 * 1000); // 5 seconds
});

client.on("messageCreate", async (message) => {
    if (
        !message.guild ||
        message.author.bot
    ) return;

    const gdb = await db.guild(message.guild.id);
    const gsdb = await db.settings(message.guild.id);

    if (gdb.get().mutes[message.author.id] && gsdb.get().delMuted) return deleteMessage(message);
    if (gdb.get().mutes[message.author.id]) return;

    global.gdb = gdb;
    global.gsdb = gsdb;
    global.gldb = db.global;
    if (message.content.startsWith(config.prefix) || message.content.match(`^<@!?${client.user.id}> `)) return commandHandler(message, config.prefix, gdb, db);
    if (message.content.match(`^<@!?${client.user.id}>`)) return message.react("👋").catch(() => { });
});

const updatePresence = async () => {
    const gc = await client.shard.broadcastEval(bot => bot.guilds.cache.size).then(res => res.reduce((prev, cur) => prev + cur, 0));
    let text = `тикток фм | ${gc} guilds`;
    return client.user.setPresence({
        status: "idle",
        activities: [{ type: "PLAYING", name: text }],
    });
};

client.on("guildCreate", async (guild) => {
    await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: client.slashes }).catch(() => { });
    const members = await guild.members.fetch();
    const owner = await client.users.fetch(guild.ownerId);

    client.users.fetch("419892040726347776").then((u) => u.send({
        content: "<a:pepeD:904171928091234344> new guild <a:pepeD:904171928091234344>",
        embeds: [{
            title: guild.name,
            author: {
                name: `${owner.tag} - ${owner.id}`,
                iconURL: owner.avatarURL({ dynamic: true, format: "png" })
            },
            thumbnail: guild.iconURL({ dynamic: true, format: "png", size: 512 }),
            fields: [{
                name: "counts",
                value: [
                    `🤖 \`${members.filter((a) => a.user.bot).size}\``,
                    `🧑‍🤝‍🧑 \`${members.filter((a) => !a.user.bot).size}\``,
                    `🔵 \`${guild.memberCount}\``
                ].join("\n")
            }]
        }]
    }));
});

client.on("guildDelete", async (guild) => {
    const owner = await client.users.fetch(guild.ownerId);

    client.users.fetch("419892040726347776").then((u) => u.send({
        content: "<a:pepeD:904171928091234344> guild removed <a:pepeD:904171928091234344>",
        embeds: [{
            title: guild.name,
            author: {
                name: `${owner.tag} - ${owner.id}`,
                iconURL: owner.avatarURL({ dynamic: true, format: "png" })
            },
            thumbnail: guild.iconURL({ dynamic: true, format: "png", size: 512 }),
            fields: [{
                name: "count",
                value: `🔵 \`${guild.memberCount}\``
            }]
        }]
    }));
});

if (!config.dev) client.on("voiceChannelJoin", voicesJoin);
if (!config.dev) client.on("voiceChannelLeave", voicesLeave);
if (!config.dev) client.on("voiceChannelSwitch", voicesSwitch);
client.on("error", (err) => console.error(`${shard} Client error. ${err}`));
client.on("rateLimit", (rateLimitInfo) => console.warn(`${shard} Rate limited.\n${JSON.stringify(rateLimitInfo)}`));
client.on("shardDisconnected", (closeEvent) => console.warn(`${shard} Disconnected. ${closeEvent}`));
client.on("shardError", (err) => console.error(`${shard} Error. ${err}`));
client.on("shardReconnecting", () => console.log(`${shard} Reconnecting.`));
client.on("shardResume", (_, replayedEvents) => console.log(`${shard} Resumed. ${replayedEvents} replayed events.`));
client.on("warn", (info) => console.warn(`${shard} Warning. ${info}`));
client.login(config.token);

process.on("unhandledRejection", (rej) => console.error(rej));