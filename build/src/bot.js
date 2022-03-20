"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkRates = exports.shard = exports.client = void 0;
require("nodejs-better-console").overrideConsole();
const fs_1 = __importDefault(require("fs"));
const discord_js_1 = __importDefault(require("discord.js"));
const config_1 = __importDefault(require("../config"));
const pretty_ms_1 = __importDefault(require("pretty-ms"));
const lava_1 = __importDefault(require("./handlers/lava"));
const prepareGuilds_1 = __importDefault(require("./handlers/prepareGuilds"));
const tickers_1 = __importDefault(require("./handlers/tickers"));
exports.client = new discord_js_1.default.Client({
    makeCache: discord_js_1.default.Options.cacheWithLimits({
        MessageManager: {
            sweepInterval: 600,
            maxSize: 2048,
            sweepFilter: discord_js_1.default.LimitedCollection.filterByLifetime({
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
const database_1 = __importDefault(require("./database/"));
const callbacks_1 = require("./constants/callbacks");
require("discord-logs")(exports.client);
const util_1 = __importDefault(require("util"));
exports.shard = "[Shard N/A]";
exports.linkRates = new Map();
exports.client.once("shardReady", async (shardId, unavailable = new Set()) => {
    let start = Date.now();
    exports.shard = `[Shard ${shardId}]`;
    exports.client.loading = true;
    let slashPostStart = Date.now();
    require("./handlers/interactions/slash").registerCommands(exports.client).then(() => {
        console.log(`${exports.shard} Refreshed slash commands. [${(0, pretty_ms_1.default)(Date.now() - slashPostStart)}]`);
    });
    console.log(`${exports.shard} Ready as ${exports.client.user?.tag}! Caching guilds.`);
    let disabledGuilds = new Set([...Array.from(unavailable), ...exports.client.guilds.cache.map((g) => g.id)]);
    let guildCachingStart = Date.now();
    await database_1.default.cacheGSets(disabledGuilds);
    await database_1.default.cacheGuilds(disabledGuilds);
    console.log(`${exports.shard} All ${disabledGuilds.size} guilds have been cached. Processing available guilds. [${Date.now() - guildCachingStart}ms]`);
    for (const id of disabledGuilds)
        exports.linkRates.set(id, new Set());
    let processingStartTimestamp = Date.now(), completed = 0, presenceInterval = setInterval(() => exports.client.user?.setPresence({
        status: "idle",
        activities: [{
                type: "WATCHING",
                name: `${Math.floor((completed / exports.client.guilds.cache.size) * 100)}%`
            }]
    }), 1000);
    await Promise.all(exports.client.guilds.cache.map(async (guild) => {
        await (0, prepareGuilds_1.default)(guild);
        disabledGuilds.delete(guild.id);
        completed++;
    }));
    disabledGuilds = undefined;
    clearInterval(presenceInterval);
    console.log(`${exports.shard} All ${exports.client.guilds.cache.size} available guilds have been processed. [${Date.now() - processingStartTimestamp}ms]`);
    (0, tickers_1.default)(exports.client);
    exports.client.loading = false;
    console.log(`${exports.shard} Ready in ${(0, pretty_ms_1.default)(Date.now() - start)}`);
    exports.client.manager = (0, lava_1.default)(exports.client);
    exports.client.on("raw", (d) => exports.client.manager.updateVoiceState(d));
});
const commandFiles = fs_1.default.readdirSync(__dirname + "/events/").filter((x) => x.endsWith(".js"));
for (const filename of commandFiles) {
    const file = require(`./events/${filename}`);
    if (file.once) {
        exports.client.once(file.name, (...args) => file.run(exports.client, ...args));
    }
    else {
        exports.client.on(file.name, (...args) => file.run(exports.client, ...args));
    }
    ;
}
;
exports.client.on("voiceChannelJoin", callbacks_1.voicesJoin);
exports.client.on("voiceChannelLeave", callbacks_1.voicesLeave);
exports.client.on("voiceChannelSwitch", callbacks_1.voicesSwitch);
exports.client.on("error", (err) => console.error(`${exports.shard} Client error. ${util_1.default.inspect(err)}`));
exports.client.on("rateLimit", (rateLimitInfo) => console.warn(`${exports.shard} Rate limited.\n${JSON.stringify(rateLimitInfo)}`));
exports.client.on("shardDisconnected", ({ code, reason }) => console.warn(`${exports.shard} Disconnected. (${code} - ${reason})`));
exports.client.on("shardError", (err) => console.error(`${exports.shard} Error. ${util_1.default.inspect(err)}`));
exports.client.on("shardResume", (_, replayedEvents) => console.log(`${exports.shard} Resumed. ${replayedEvents} replayed events.`));
exports.client.on("warn", (info) => console.warn(`${exports.shard} Warning. ${info}`));
database_1.default.connection.then(() => exports.client.login(config_1.default.token)).catch(() => exports.client.shard.send("respawn"));
process.on("unhandledRejection", (e) => console.error(exports.shard, e));
process.on("uncaughtException", (e) => {
    console.error(exports.shard, e);
    exports.client.shard.send("respawn");
});
