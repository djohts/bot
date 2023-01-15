import { ActivityType, Client, GatewayIntentBits, Options, Partials } from "discord.js";
import { ClusterClient, getInfo } from "discord-hybrid-sharding";
import { connection, touchGuildDocument } from "./database";
import { clientLogger } from "./utils/logger/cluster";
import { readdirSync } from "node:fs";
import { inspect } from "util";
import prepareGuild from "./handlers/prepareGuilds";
import tickers from "./handlers/tickers";
import Util from "./utils/Util";

export const client = new Client({
    makeCache: Options.cacheWithLimits({
        MessageManager: 512
    }),
    sweepers: {
        messages: {
            interval: 600,
            lifetime: 60 * 60 * 24 // 24 hours
        }
    },
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
        Partials.Message,
        Partials.GuildMember
    ],
    presence: {
        status: "dnd",
        activities: [{
            type: ActivityType.Watching,
            name: "the loading screen",
        }]
    },
    shards: getInfo().SHARD_LIST,
    shardCount: getInfo().TOTAL_SHARDS
});

import "./lib/i18n";

Util.setClient(client);

client.cluster = new ClusterClient(client);
client.loading = true;

export const cluster = `[Cluster ${client.cluster.id}]`;
export let disabledGuilds: Set<string>;
const loggingin = Date.now();
client.once("ready", async () => {
    const start = Date.now();

    clientLogger.info(`Logged in as ${client.user!.tag} in ${Date.now() - loggingin}ms`);
    const shards = client.options.shards as number[];
    clientLogger.info(`Serving ${shards.length} shards: ${shards.join(", ")}`)

    disabledGuilds = new Set<string>(client.guilds.cache.map((g) => g.id));

    if (client.guilds.cache.size) {
        const guildCachingStart = Date.now();
        await touchGuildDocument([...disabledGuilds]);
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

    client.cluster.spawnNextCluster();
});

const eventFiles = readdirSync(__dirname + "/events/").filter((x) => x.endsWith(".js"));
for (const filename of eventFiles) {
    const file = require(`./events/${filename}`);
    const name = filename.split(".")[0]!;
    if (file.once) {
        client.once(name, file.run);
    } else {
        client.on(name, file.run);
    };
};

client.on("error", (err) => void clientLogger.error(`Error. ${inspect(err)}`));
client.on("warn", (info) => void clientLogger.warn(`Warning. ${inspect(info)}`));
client.on("shardReconnecting", (id) => void clientLogger.warn(`[Shard ${id}] Reconnecting.`));
client.on("shardResume", (id, events) => void clientLogger.warn(`[Shard ${id}] Resumed. ${events} replayed events.`));
client.on("shardDisconnect", ({ code, reason }, id) => void clientLogger.warn(`[Shard ${id}] Disconnected. (${code} - ${reason})`));
client.rest.on("rateLimited", (rateLimitInfo) => void clientLogger.warn(`Rate limited.\n${inspect(rateLimitInfo)}`));

connection.then(() => client.login()).catch((e) => {
    clientLogger.error(e);
    process.exit();
});

process.on("unhandledRejection", (e) => void clientLogger.error(`unhandledRejection:\n${inspect(e)}`));
process.on("uncaughtException", (e) => void clientLogger.error(`uncaughtException:\n${inspect(e)}`));

clientLogger.info("=".repeat(55));