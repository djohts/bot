import { Collection, Guild, GuildMember, Message, ActionRowBuilder, ButtonBuilder, WebhookClient, ButtonStyle, PermissionFlagsBits, Client } from "discord.js";
import { getGlobalDocument, getGuildDocument } from "../database";
import { loadCommands } from "../handlers/interactions/slash";
import { BcBotBumpAction } from "../../types";
import { splitBar } from "string-progressbar";
import { Manager, Player } from "erela.js";
import { inspect } from "util";
import config from "../constants/config";
import prettyms from "pretty-ms";
import i18n from "./i18n";
const uselesswebhook = new WebhookClient({ url: config.useless_webhook });

let util: Util | null = null;

class Util {
    constructor() {
        if (util) return util;
        util = this;
    };

    private _client: Client | null = null;
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
        tickMusicPlayer: async (player: Player): Promise<void> => {
            const document = await getGuildDocument(player.guild);
            const _ = this.i18n.getLocale(document.locale);

            try {
                const track = player.queue.current;
                const message = player.get<Message<true>>("message");
                if (
                    !track
                    || !message
                    || !message.channel
                ) return;

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

                await message.edit({
                    content: null,
                    embeds: [{
                        title: track.title,
                        url: track.uri,
                        thumbnail: {
                            url: track.thumbnail
                        },
                        fields: [{
                            name: _("generic.musicTicker.channel"),
                            value: track.author,
                            inline: true
                        }, {
                            name: _("generic.musicTicker.progress"),
                            value: progressComponent,
                        }]
                    }]
                });
            } catch (e) {
                return player.set("message", undefined);
            };
        },
        updateGuildStatsChannels: async (guildId: string): Promise<void> => {
            const guild = this.client.guilds.cache.get(guildId);
            if (
                !guild
                || !guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)
            ) return;
            const document = await getGuildDocument(guildId);
            if (!Object.keys(document.statschannels).length) return;

            const whethertofetchmembers = Array.from(document.statschannels.values())
                .some(({ template }) => template.includes("{users}") || template.includes("{bots}"));

            let fetchedMembers: Collection<string, GuildMember>;
            if (whethertofetchmembers) fetchedMembers = await guild.members.fetch({ time: 15_000 }).catch(() => null);
            if (!fetchedMembers) return;

            const statsdata = {
                members: guild.memberCount,
                channels: guild.channels.cache.size,
                roles: guild.roles.cache.size,
                users: fetchedMembers?.filter((m) => !m.user.bot).size,
                bots: fetchedMembers?.filter((m) => m.user.bot).size
            };

            for (const [channelId, { template }] of Array.from(document.statschannels)) {
                const channel = guild.channels.cache.get(channelId);
                if (!channel) {
                    document.statschannels.delete(channelId);
                    continue;
                };

                let newtext = template
                    .replace(/\{members\}/g, statsdata.members.toLocaleString())
                    .replace(/\{channels\}/g, statsdata.channels.toLocaleString())
                    .replace(/\{roles\}/g, statsdata.roles.toLocaleString());

                if (fetchedMembers) newtext = newtext
                    .replace(/\{users\}/g, statsdata.users.toLocaleString())
                    .replace(/\{bots\}/g, statsdata.bots.toLocaleString());

                await channel.edit({ name: newtext });
            };

            document.safeSave();
        },
        checkGuildBans: async (guild: Guild) => {
            if (
                !guild.available
                || !guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)
            ) return;

            const document = await getGuildDocument(guild.id);

            const ids = Array.from(document.bans.keys()).filter((k) => (document.bans.get(k)?.expiresTimestamp ?? 0) <= Date.now());
            if (!ids.length) return;

            await Promise.all<Promise<void>>(ids.map((key) =>
                guild.bans.remove(key)
                    .then(() => void document.bans.delete(key))
                    .catch(() => void document.bans.delete(key))
            ));
            document.safeSave();
        },
        processBotBump: async (options: BcBotBumpAction) => {
            const global = await getGlobalDocument();
            global.addBump({
                userId: options.data.user,
                next: options.data.at + (options.bonus?.status ? 6 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000)
            });

            const user = await this.client.users.fetch(options.data.user);

            await user.send({
                embeds: [{
                    title: "Мониторинг",
                    description: [
                        "Спасибо за ап на `boticord.top`!",
                        "Нажав на кнопку ниже, вы подпишетесь на уведомления о возможности поднимать в рейтинге нашего бота."
                    ].join("\n")
                }],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setLabel("Подписаться").setStyle(ButtonStyle.Secondary).setCustomId(`subscribe:boticord:${options.data.user}`)
                    )
                ]
            }).catch(() => null);

            await this.func.uselesslog({ content: `${user.tag} ${user} (\`${user.id}\`) bumped on boticord.top` });
        },
        registerCommands: () => {
            const dev = !config.monitoring.bc;

            const commands = loadCommands().filter((x) => !["eval", "exec"].includes(x.name));

            return dev
                ? this._client.guilds.cache.get("957937585299292192").commands.set(commands)
                : this._client.application.commands.set(commands);
        },
        getCommandMention: async (name: string) => {
            const dev = !config.monitoring.bc;

            const commands = dev
                ? await this._client.guilds.cache.get("957937585299292192").commands.fetch()
                : await this._client.application.commands.fetch();

            const root_name = name.split(" ")[0];
            const command = commands.find((c) => c.name === root_name);

            return `</${name}:${command.id}>`;
        },
        uselesslog: (x: unknown) => uselesswebhook.send(x)
    };

    public setClient(client: Client): Util {
        client.util = this;
        this._client = client;
        return this;
    };
    public setLavaManager(lavaManager: Manager): Util {
        this._lavaManager = lavaManager;
        return this;
    };

    get client() {
        return this._client;
    };
    get lava() {
        return this._lavaManager;
    };
};

export = new Util;