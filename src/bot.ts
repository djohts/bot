require("nodejs-better-console").overrideConsole();
import fs from "fs";
import Discord from "discord.js";
import config from "../config";
import prettyms from "pretty-ms";
import lavaHandler from "./handlers/lava";
import prepareGuild from "./handlers/prepareGuilds";
import tickers from "./handlers/tickers";
export const client = new Discord.Client({
    makeCache: Discord.Options.cacheWithLimits({
        MessageManager: {
            sweepInterval: 600,
            maxSize: 2048,
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
}) as ModifiedClient;
import db from "./database/";
import { voicesJoin, voicesLeave, voicesSwitch } from "./constants/callbacks";
require("discord-logs")(client);

import util from "util";
import { ModifiedClient } from "./constants/types";

export let shard = "[Shard N/A]";
export const linkRates = new Map();
client.once("shardReady", async (shardId, unavailable = new Set()) => {
    let start = Date.now();
    shard = `[Shard ${shardId}]`;

    client.loading = true;

    let slashPostStart = Date.now();
    require("./handlers/interactions/slash").registerCommands(client).then(() => {
        console.log(`${shard} Refreshed slash commands. [${prettyms(Date.now() - slashPostStart)}]`);
    });

    console.log(`${shard} Ready as ${client.user?.tag}! Caching guilds.`);

    let disabledGuilds = new Set([...Array.from(unavailable), ...client.guilds.cache.map((g) => g.id)]);
    let guildCachingStart = Date.now();

    await db.cacheGSets(disabledGuilds);
    await db.cacheGuilds(disabledGuilds);
    console.log(`${shard} All ${disabledGuilds.size} guilds have been cached. Processing available guilds. [${Date.now() - guildCachingStart}ms]`);

    for (const id of disabledGuilds) linkRates.set(id, new Set());
    let processingStartTimestamp = Date.now(), completed = 0, presenceInterval = setInterval(() => client.user?.setPresence({
        status: "idle",
        activities: [{
            type: "WATCHING",
            name: `${Math.floor((completed / client.guilds.cache.size) * 100)}%`
        }]
    }), 1000);
    await Promise.all(client.guilds.cache.map(async (guild) => {
        await prepareGuild(guild);
        disabledGuilds.delete(guild.id);
        completed++;
    }));
    disabledGuilds = undefined;
    clearInterval(presenceInterval);
    console.log(`${shard} All ${client.guilds.cache.size} available guilds have been processed. [${Date.now() - processingStartTimestamp}ms]`);

    tickers(client);

    client.loading = false;
    console.log(`${shard} Ready in ${prettyms(Date.now() - start)}`);

    client.manager = lavaHandler(client);
    client.on("raw", (d) => client.manager.updateVoiceState(d));
});

const commandFiles = fs.readdirSync(__dirname + "/events/").filter((x) => x.endsWith(".js"));
for (const filename of commandFiles) {
    const file = require(`./events/${filename}`);
    if (file.once) {
        client.once(file.name, (...args) => file.run(client, ...args));
    } else {
        client.on(file.name, (...args) => file.run(client, ...args));
    };
};

client.on("voiceChannelJoin", voicesJoin);
client.on("voiceChannelLeave", voicesLeave);
client.on("voiceChannelSwitch", voicesSwitch);
client.on("error", (err) => console.error(`${shard} Client error. ${util.inspect(err)}`));
client.on("rateLimit", (rateLimitInfo) => console.warn(`${shard} Rate limited.\n${JSON.stringify(rateLimitInfo)}`));
client.on("shardDisconnected", ({ code, reason }) => console.warn(`${shard} Disconnected. (${code} - ${reason})`));
client.on("shardError", (err) => console.error(`${shard} Error. ${util.inspect(err)}`));
client.on("shardResume", (_, replayedEvents) => console.log(`${shard} Resumed. ${replayedEvents} replayed events.`));
client.on("warn", (info) => console.warn(`${shard} Warning. ${info}`));

db.connection.then(() => client.login(config.token)).catch(() => client.shard.send("respawn"));

process.on("unhandledRejection", (e) => console.error(shard, e));
process.on("uncaughtException", (e) => {
    console.error(shard, e);
    client.shard.send("respawn");
});