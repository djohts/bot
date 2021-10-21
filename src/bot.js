const Discord = require("discord.js");
const config = require("../config");
const commandHandler = require("./handlers/commands");
const slashHandler = require("./handlers/interactions/");
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
require("discord-logs")(client);

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

    slashHandler(client);

    client.loading = false;

    await require("./handlers/interactions/slash").registerCommands(client);
    log.log(`${shard} Refreshed slash commands.`, {
        title: shard,
        description: "```\nRefreshed slash commands.\n```"
    });

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
    const gc = await client.shard.broadcastEval(bot => bot.guilds.cache.size).then(res => res.reduce((prev, cur) => prev + cur, 0));
    let name = `тикток фм | ${gc} guilds`;
    return client.user.setPresence({
        status: "idle",
        activities: [{ type: "LISTENING", name }],
    });
};

client.on("guildCreate", async (guild) => {
    await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: client.slashes }).catch(() => { });
    const members = await guild.members.fetch();
    const owner = await client.users.fetch(guild.ownerId);

    client.users.fetch("419892040726347776").then((u) => u.send({
        content: "<a:pepeD:898300124575445072> new guild <a:pepeD:898300124575445072>",
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
        content: "<a:pepeD:898300124575445072> guild removed <a:pepeD:898300124575445072>",
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

client.on("error", (err) => log.error(`${shard} Client error. ${err}`, {
    title: shard,
    description: "```\n" + `Client error. ${err}` + "\n```"
}));
client.on("rateLimit", (rateLimitInfo) => log.warn(`${shard} Rate limited.\n${JSON.stringify(rateLimitInfo)}`, {
    title: shard,
    description: "```\n" + `Rate limited.\n${JSON.stringify(rateLimitInfo)}` + "\n```"
}));
client.on("shardDisconnected", (closeEvent) => log.warn(`${shard} Disconnected. ${closeEvent}`, {
    title: shard,
    description: "```\n" + `Disconnected. ${closeEvent}` + "\n```"
}));
client.on("shardError", (err) => log.error(`${shard} Error. ${err}`, {
    title: shard,
    description: "```\n" + `Error. ${err}` + "\n```"
}));
client.on("shardReconnecting", () => log.log(`${shard} Reconnecting.`, {
    title: shard,
    description: "```\nReconnecting.\n```"
}));
client.on("shardResume", (_, replayedEvents) => log.log(`${shard} Resumed. ${replayedEvents} replayed events.`, {
    title: shard,
    description: "```\n" + `Resumed. ${replayedEvents} replayed events.` + "\n```"
}));
client.on("warn", (info) => log.warn(`${shard} Warning. ${info}`, {
    title: shard,
    description: "```\n" + `Warning. ${info}` + "\n```"
}));
client.login(config.token);

process.on("unhandledRejection", (rej) => log.error(rej.message + "\n" + rej.stack));
process.on("SIGINT", () => process.exit());