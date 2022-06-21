"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const util_1 = require("util");
const string_progressbar_1 = require("string-progressbar");
const pretty_ms_1 = __importDefault(require("pretty-ms"));
let util = null;
class Util {
    constructor() {
        if (util)
            return util;
        util = this;
    }
    ;
    _client = null;
    _database = null;
    _lavaManager = null;
    inspect = util_1.inspect;
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    prettyBytes = (bytes, { maximumFractionDigits = 2 }) => {
        const suffixes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        let i = 0;
        while (bytes >= 1024) {
            bytes /= 1024;
            i++;
        }
        ;
        return `${bytes.toFixed(maximumFractionDigits)} ${suffixes[i]}`;
    };
    func = {
        tickMusicPlayers: async (player) => {
            try {
                const track = player.queue.current;
                const message = player.get("message");
                if (!track || !message || !message.editable)
                    return;
                const duration = Math.floor(track.duration / 1000) * 1000;
                const position = Math.floor(player.position / 1000) * 1000;
                const progressComponent = [
                    (0, string_progressbar_1.splitBar)(duration, position, 20)[0],
                    ` [`,
                    (0, pretty_ms_1.default)(position, { colonNotation: true, compact: true }),
                    ` / `,
                    (0, pretty_ms_1.default)(duration, { colonNotation: true, compact: true }),
                    `]`
                ].join("");
                return await message.edit({
                    content: null,
                    embeds: [{
                            title: track.title,
                            url: track.uri,
                            thumbnail: {
                                url: track.thumbnail
                            },
                            fields: [{
                                    name: "Автор",
                                    value: track.author,
                                    inline: true
                                }, {
                                    name: "Прогресс",
                                    value: progressComponent,
                                }]
                        }]
                });
            }
            catch {
                return;
            }
            ;
        },
        updateGuildStatsChannels: async (guildId) => {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild)
                return;
            const gdb = await this._database.guild(guildId);
            let { statschannels } = gdb.get();
            if (!Object.keys(statschannels).length)
                return;
            const whethertofetchmembers = Object.values(statschannels).some((x) => x.includes("{users}") || x.includes("{bots}"));
            let fetchedMembers = null;
            if (whethertofetchmembers)
                fetchedMembers = await guild.members.fetch({ force: true, time: 30000 });
            const statsdata = {
                members: guild.memberCount,
                channels: guild.channels.cache.size,
                roles: guild.roles.cache.size,
                users: fetchedMembers?.filter((m) => !m.user.bot).size,
                bots: fetchedMembers?.filter((m) => m.user.bot).size
            };
            for (const [channelId, text] of Object.entries(statschannels)) {
                const channel = guild.channels.cache.get(channelId);
                if (!channel) {
                    gdb.removeFromObject("statschannels", channelId);
                    continue;
                }
                ;
                let newtext = text
                    .replace(/\{members\}/g, statsdata.members.toString())
                    .replace(/\{channels\}/g, statsdata.channels.toString())
                    .replace(/\{roles\}/g, statsdata.roles.toString());
                if (whethertofetchmembers)
                    newtext = newtext
                        .replace(/\{users\}/g, statsdata.users.toString())
                        .replace(/\{bots\}/g, statsdata.bots.toString());
                await channel.edit({ name: newtext });
            }
            ;
        },
        checkGuildBans: async (guild) => {
            if (!guild.available)
                return;
            const gdb = await this.database.guild(guild.id);
            let { bans } = gdb.get();
            let ids = Object.keys(bans).filter((key) => bans[key] !== -1 && bans[key] <= Date.now());
            if (!ids.length)
                return;
            await Promise.all(ids.map(async (key) => {
                if (!guild.me.permissions.has("BAN_MEMBERS"))
                    return;
                await guild.bans.remove(key)
                    .then(() => gdb.removeFromObject("bans", key))
                    .catch(() => gdb.removeFromObject("bans", key));
            }));
        }
    };
    setClient(client) {
        Promise.resolve().then(() => __importStar(require("discord-logs"))).then((x) => x.default(client));
        client.util = this;
        this._client = client;
        return this;
    }
    ;
    setDatabase(database) {
        this._database = database;
        return this;
    }
    ;
    setLavaManager(lavaManager) {
        this._lavaManager = lavaManager;
        return this;
    }
    ;
    get client() {
        return this._client;
    }
    ;
    get database() {
        return this._database;
    }
    ;
    get lava() {
        return this._lavaManager;
    }
    ;
}
;
module.exports = new Util;
