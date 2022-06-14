require("nodejs-better-console").overrideConsole();
import fs from "fs";
import db from "./database/";
import { inspect } from "util";
import Util from "./util/Util";
import Discord from "discord.js";
import prettyms from "pretty-ms";
import Dokdo from "dokdo";
import tickers from "./handlers/tickers";
import lavaHandler from "./handlers/lava";
import { ModifiedClient } from "./constants/types";
import prepareGuild from "./handlers/prepareGuilds";
import { registerCommands } from "./handlers/interactions/slash";
export const client = new ModifiedClient({
    makeCache: Discord.Options.cacheWithLimits({
        MessageManager: 4096
    }),
    sweepers: {
        messages: {
            interval: 600,
            lifetime: 24 * 60 * 60 // 24 hours
        }
    },
    intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS", "GUILD_BANS", "GUILD_VOICE_STATES"],
    presence: {
        status: "dnd",
        activities: [{
            type: "WATCHING",
            name: "the loading screen",
        }]
    }
});
export const dokdo = new Dokdo(client, { aliases: ["d"], prefix: "!", noPerm: () => null, owners: ["419892040726347776"] });
Util.setClient(client).setDatabase(db);

export let shard = "[Shard N/A]";
export const linkRates = new Map<string, Set<string>>();
client.once("shardReady", async (shardId, unavailable = new Set()) => {
    client.cfg = {
        enslash: true,
        enbr: true,
        debug: false
    };
    Util.setLavaManager(lavaHandler(client));
    let start = Date.now();
    shard = `[Shard ${shardId}]`;

    client.loading = true;

    let slashPostStart = Date.now();
    registerCommands(client).then((a) => {
        console.log(`${shard} Refreshed slash commands for ${a.length}/${client.guilds.cache.size} guilds. [${prettyms(Date.now() - slashPostStart)}]`);
    });

    console.log(`${shard} Ready as ${client.user?.tag}! Caching guilds.`);

    let disabledGuilds = new Set<string>([...Array.from(unavailable), ...client.guilds.cache.map((g) => g.id)]);
    let guildCachingStart = Date.now();

    await db.cacheGSets(disabledGuilds);
    await db.cacheGuilds(disabledGuilds);
    console.log(`${shard} All ${disabledGuilds.size} guilds have been cached. Processing available guilds. [${Date.now() - guildCachingStart}ms]`);

    for (const id of disabledGuilds) linkRates.set(id, new Set());
    let processingStartTimestamp = Date.now(), completed = 0, presenceInterval = setInterval(() => client.user?.setPresence({
        status: "dnd",
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
});

const eventFiles = fs.readdirSync(__dirname + "/events/").filter((x) => x.endsWith(".js"));
for (const filename of eventFiles) {
    const file = require(`./events/${filename}`);
    const name = filename.split(".")[0];
    if (file.once) {
        client.once(name, file.run);
    } else {
        client.on(name, file.run);
    };
};

client.on("error", (err) => console.error(shard, `Client error. ${inspect(err)}`));
client.on("rateLimit", (rateLimitInfo) => console.warn(shard, `Rate limited.\n${JSON.stringify(rateLimitInfo)}`));
client.on("shardDisconnected", ({ code, reason }) => console.warn(shard, `Disconnected. (${code} - ${reason})`));
client.on("warn", (info) => console.warn(shard, `Warning. ${info}`));

db.connection.then(() => client.login()).catch((e) => console.error(shard, e));

process.on("unhandledRejection", (e) => console.error(shard, "unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error(shard, "uncaughtException:", e));