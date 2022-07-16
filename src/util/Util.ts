import { ModifiedClient } from "../constants/types";
import { inspect } from "util";
import { Manager, Player } from "erela.js";
import { Collection, Guild, GuildMember, Message } from "discord.js";
import { splitBar } from "string-progressbar";
import prettyms from "pretty-ms";
import i18n from "./i18n";

let util: Util | null = null;

class Util {
    constructor() {
        if (util) return util;
        util = this;
    };

    private _client: ModifiedClient | null = null;
    private _database: typeof import("../database/") | null = null;
    private _lavaManager: Manager | null = null;
    public i18n = i18n;
    public inspect = inspect;
    public wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
    public prettyBytes = (bytes: number, maximumFractionDigits = 2): string => {
        const suffixes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        let i = 0;
        while (bytes >= 1024) {
            bytes /= 1024;
            i++;
        };
        return `${bytes.toFixed(maximumFractionDigits)} ${suffixes[i]}`;
    };
    public func = {
        tickMusicPlayers: async (player: Player): Promise<void | Message> => {
            try {
                const track = player.queue.current;
                const message = player.get("message") as Message | undefined;
                if (!track || !message || !message.editable) return;

                const duration = Math.floor(track.duration / 1000) * 1000;
                const position = Math.floor(player.position / 1000) * 1000;
                const progressComponent = [
                    splitBar(duration, position, 20)[0],
                    ` [`,
                    prettyms(position, { colonNotation: true, compact: true }),
                    ` / `,
                    prettyms(duration, { colonNotation: true, compact: true }),
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
            } catch { return; };
        },
        updateGuildStatsChannels: async (guildId: string): Promise<void> => {
            let failed = false;
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;
            const gdb = await this._database.guild(guildId);
            let { statschannels } = gdb.get();
            if (!Object.keys(statschannels).length) return;

            const whethertofetchmembers = Object.values(statschannels).some((x) => x.includes("{users}") || x.includes("{bots}"));

            let fetchedMembers: null | Collection<string, GuildMember> = null;
            if (whethertofetchmembers) fetchedMembers = await guild.members.fetch({ force: true, time: 30_000 }).catch(() => { failed = true; return null; });
            if (failed) return;

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
                };
                let newtext = text
                    .replace(/\{members\}/g, statsdata.members.toString())
                    .replace(/\{channels\}/g, statsdata.channels.toString())
                    .replace(/\{roles\}/g, statsdata.roles.toString());

                if (whethertofetchmembers) newtext = newtext
                    .replace(/\{users\}/g, statsdata.users.toString())
                    .replace(/\{bots\}/g, statsdata.bots.toString());

                await channel.edit({ name: newtext });
            };
        },
        checkGuildBans: async (guild: Guild) => {
            if (!guild.available) return;

            const gdb = await this.database.guild(guild.id);
            let { bans } = gdb.get();
            let ids = Object.keys(bans).filter((key) => bans[key] !== -1 && bans[key] <= Date.now());
            if (!ids.length) return;

            await Promise.all(ids.map(async (key) => {
                if (!guild.me.permissions.has("BAN_MEMBERS")) return;

                await guild.bans.remove(key)
                    .then(() => gdb.removeFromObject("bans", key))
                    .catch(() => gdb.removeFromObject("bans", key));
            }));
        }
    };

    public setClient(client: ModifiedClient): Util {
        import("discord-logs").then((x) => x.default(client))
        client.util = this;
        this._client = client;
        return this;
    };

    public setDatabase(database: typeof import("../database/")): Util {
        this._database = database;
        return this;
    };

    public setLavaManager(lavaManager: Manager): Util {
        this._lavaManager = lavaManager;
        return this;
    };

    get client() {
        return this._client;
    };
    get database() {
        return this._database;
    };
    get lava() {
        return this._lavaManager;
    };
};

export = new Util;