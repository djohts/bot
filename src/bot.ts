import { ActivityType, Client, GatewayIntentBits, Options, Partials } from "discord.js";
import { readdirSync } from "node:fs";
import { inspect } from "util";
import prepareGuild from "./handlers/prepareGuilds";
import Sharding from "discord-hybrid-sharding";
import lavaHandler from "./handlers/lava";
import tickers from "./handlers/tickers";
import Util from "./util/Util";
import db from "./database/";
export const client = new Client({
    makeCache: Options.cacheWithLimits({
        MessageManager: 512
    }),
    sweepers: {
        messages: {
            interval: 600,
            lifetime: 24 * 60 * 60 // 24 hours
        }
    },
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel],
    presence: {
        status: "dnd",
        activities: [{
            type: ActivityType.Watching,
            name: "the loading screen",
        }]
    },
    shards: Sharding.Client.getInfo().SHARD_LIST,
    shardCount: Sharding.Client.getInfo().TOTAL_SHARDS
});
client.connecting = true;
client.loading = true;
client.database = db;
Util.setClient(client).setDatabase(db);
import { clientLogger } from "./util/logger/normal";

export const cluster = `[Cluster ${client.cluster.id}]`;
export let disabledGuilds: Set<string>;
const loggingin = Date.now();
client.once("ready", async () => {
    let start = Date.now();
    client.connecting = false;

    clientLogger.info(`Logged in as ${client.user!.tag} in ${Date.now() - loggingin}ms`);

    Util.setLavaManager(lavaHandler(client));

    disabledGuilds = new Set<string>(client.guilds.cache.map((g) => g.id));

    if (client.guilds.cache.size) {
        const guildCachingStart = Date.now();
        await db.cacheGSets(disabledGuilds);
        await db.cacheGuilds(disabledGuilds);
        await (await db.global()).reload();
        clientLogger.info(`Cached ${disabledGuilds.size} guilds. [${Date.now() - guildCachingStart}ms]`);

        let processingStartTimestamp = Date.now(), completed = 0, presenceInterval = setInterval(() => client.user!.setPresence({
            status: "dnd",
            activities: [{
                type: ActivityType.Watching,
                name: `${Math.floor((completed / client.guilds.cache.size) * 100)}%`
            }]
        }), 1000);
        await Promise.all(client.guilds.cache.map(async (guild) => {
            await prepareGuild(guild);
            disabledGuilds.delete(guild.id);
            completed++;
        }));
        clearInterval(presenceInterval);
        clientLogger.info(`Processed ${client.guilds.cache.size} guilds. [${Date.now() - processingStartTimestamp}ms]`);
    };

    tickers();

    client.loading = false;
    clientLogger.info(`Ready in ${Date.now() - start}ms`);
});

const eventFiles = readdirSync(__dirname + "/events/").filter((x) => x.endsWith(".js"));
for (const filename of eventFiles) {
    const file = require(`./events/${filename}`);
    const name = filename.split(".")[0];
    if (file.once) {
        client.once(name, file.run);
    } else {
        client.on(name, file.run);
    };
};

client.on("error", (err) => void clientLogger.error(`Error. ${inspect(err)}`));
client.rest.on("rateLimited", (rateLimitInfo) => void clientLogger.warn(`Rate limited.\n${inspect(rateLimitInfo)}`));
client.on("shardDisconnect", ({ code, reason }, id) => void clientLogger.warn(`[Shard ${id}] Disconnected. (${code} - ${reason})`));
client.on("warn", (info) => void clientLogger.warn(`Warning. ${inspect(info)}`));

client.on("debug", (info) => {
    if (client.cfg.debug) clientLogger.debug(info);
});

db.connection.then(() => client.login()).catch((e) => {
    clientLogger.error(e);
    process.exit();
});

process.on("unhandledRejection", (e) => void clientLogger.error(`unhandledRejection:\n${inspect(e)}`));
process.on("uncaughtException", (e) => void clientLogger.error(`uncaughtException:\n${inspect(e)}`));

clientLogger.info("=".repeat(55));