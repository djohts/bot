"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const config_1 = __importDefault(require("../../config"));
const util_1 = require("util");
const discord_js_1 = require("discord.js");
const string_progressbar_1 = require("string-progressbar");
const pretty_ms_1 = __importDefault(require("pretty-ms"));
const i18n_1 = __importDefault(require("./i18n"));
const bottleneck_1 = require("../handlers/bottleneck");
const uselesswebhook = new discord_js_1.WebhookClient({ url: config_1.default.useless_webhook });
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
    i18n = i18n_1.default;
    inspect = util_1.inspect;
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    prettyBytes = (bytes, maximumFractionDigits = 2) => {
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
            let failed = false;
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
                fetchedMembers = await guild.members.fetch({ force: true, time: 30000 }).catch(() => { failed = true; return null; });
            if (failed)
                return;
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
            if (!guild.available
                || !guild.members.me.permissions.has(discord_js_1.PermissionFlagsBits.BanMembers))
                return;
            const gdb = await this.database.guild(guild.id);
            let { bans } = gdb.get();
            let ids = Object.keys(bans).filter((key) => bans[key] !== -1 && bans[key] <= Date.now());
            if (!ids.length)
                return;
            await Promise.all(ids.map((key) => guild.bans.remove(key)
                .then(() => gdb.removeFromObject("bans", key))
                .catch(() => gdb.removeFromObject("bans", key))));
        },
        processBotBump: async (options) => {
            const { data } = options;
            const global = await this.database.global();
            global.addToArray("boticordBumps", data);
            const fetchUser = (data) => this.client.users.fetch(data.user).catch(() => null);
            const user = await bottleneck_1.UserFetcher.schedule(fetchUser, data);
            let dmsent = false;
            await user.send({
                embeds: [{
                        title: "Мониторинг",
                        description: [
                            "Спасибо за ап на `boticord.top`!",
                            "Нажав на кнопку ниже, вы подпишетесь на уведомления о возможности поднимать в рейтинге нашего бота."
                        ].join("\n")
                    }],
                components: [
                    new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setLabel("Подписаться").setStyle(discord_js_1.ButtonStyle.Secondary).setCustomId(`subscribe:boticord:${data.user}`))
                ]
            }).then(async () => { dmsent = true; }).catch(() => null);
            if (dmsent) {
                await this.func.uselesslog({ content: `${user.tag} ${user} (\`${user.id}\`) bumped on boticord.top` });
            }
            else {
                const channel = this.client.channels.cache.get("957937585999736858");
                await channel.send({
                    content: `${user},`,
                    embeds: [{
                            title: "Мониторинг",
                            description: [
                                "Спасибо за ап на `boticord.top`!",
                                "Нажав на кнопку ниже, вы подпишетесь на уведомления о возможности поднимать в рейтинге нашего бота.",
                                "Дайте боту возможность писать вам в личные сообщения, посредством удаления из чёрного списка бота или выдавая доступ на общих серверах с ботом писать в личные сообщения пользователям без добавления в друзья"
                            ].join("\n"),
                            image: {
                                url: "https://cdn.discordapp.com/attachments/768041170076827648/999436594664702012/UR4yHOER.gif"
                            }
                        }],
                    components: [
                        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setLabel("Подписаться").setStyle(discord_js_1.ButtonStyle.Secondary).setCustomId(`subscribe:boticord:${data.user}`))
                    ]
                });
            }
            ;
        },
        uselesslog: (opts) => uselesswebhook.send(opts)
    };
    setClient(client) {
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
