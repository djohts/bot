import { Collection, Guild, GuildMember, ActionRowBuilder, ButtonBuilder, WebhookClient, ButtonStyle, PermissionFlagsBits, Client, MessagePayload, WebhookMessageCreateOptions } from "discord.js";
import { getGlobalDocument, getGuildDocument } from "../database";
import { loadCommands } from "../handlers/interactions/slash";
import { BcBotBumpAction } from "../../types";
import config from "../constants/config";

const uselesswebhook = new WebhookClient({ url: config.useless_webhook });

class Util {
    private _client: Client<true> = null!;
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
        updateGuildStatsChannels: async (guildId: string): Promise<void> => {
            const guild = this.client.guilds.cache.get(guildId)!;
            if (!guild.available) return;

            const me = await guild.members.fetchMe();
            if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) return;

            const document = await getGuildDocument(guildId);
            if (!Object.keys(document.statschannels).length) return;

            const whethertofetchmembers = Array.from(document.statschannels.values())
                .some(({ template }) => template.includes("{users}") || template.includes("{bots}"));

            let fetchedMembers: Collection<string, GuildMember> | null = null;
            if (whethertofetchmembers) fetchedMembers = await guild.members.fetch({ time: 15_000 }).catch(() => null);

            const statsdata = {
                members: guild.memberCount,
                channels: guild.channels.cache.size,
                roles: guild.roles.cache.size,
                users: fetchedMembers?.filter((m) => !m.user.bot).size ?? 0,
                bots: fetchedMembers?.filter((m) => m.user.bot).size ?? 0
            };

            let needsToSave = false;
            for (const [channelId, { template }] of Array.from(document.statschannels)) {
                const channel = guild.channels.cache.get(channelId);
                if (!channel) {
                    needsToSave = true;
                    document.statschannels.delete(channelId);
                    continue;
                };

                const newtext = template
                    .replace(/\{members\}/g, statsdata.members.toLocaleString())
                    .replace(/\{channels\}/g, statsdata.channels.toLocaleString())
                    .replace(/\{roles\}/g, statsdata.roles.toLocaleString())
                    .replace(/\{users\}/g, statsdata.users.toLocaleString())
                    .replace(/\{bots\}/g, statsdata.bots.toLocaleString());

                await channel.edit({ name: newtext });
            };

            if (needsToSave) document.safeSave();
        },
        checkGuildBans: async (guild: Guild) => {
            if (!guild.available) return;
            const me = await guild.members.fetchMe();

            if (!me.permissions.has(PermissionFlagsBits.BanMembers)) return;

            const document = await getGuildDocument(guild.id);

            const ids = Array
                .from(document.bans.keys())
                .filter((k) => {
                    const ban = document.bans.get(k)!;
                    return ban.expiresTimestamp !== -1 && ban.expiresTimestamp <= Date.now();
                });
            if (!ids.length) return;

            const result = await Promise.all(ids.map((key) =>
                guild.bans.remove(key)
                    .then(() => document.bans.delete(key))
                    .catch(() => document.bans.delete(key))
            ));

            if (result.some((v) => v)) document.safeSave();
        },
        processBotBump: async (options: BcBotBumpAction) => {
            const global = await getGlobalDocument();
            global.addBump({
                userId: options.data.user,
                next: options.data.at + (options.bonus?.status ? 6 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000)
            });

            await this.client.users.send(options.data.user, {
                embeds: [{
                    title: "Мониторинг",
                    description: [
                        "Спасибо за ап на `boticord.top`!",
                        "Нажав на кнопку ниже, вы подпишетесь на уведомления о возможности поднимать в рейтинге нашего бота."
                    ].join("\n")
                }],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setLabel("Подписаться").setStyle(ButtonStyle.Secondary).setCustomId("subscribe:boticord")
                    )
                ]
            })
                .then((m) => {
                    if (m.channel.isDMBased()) {
                        const user = m.channel.recipient;

                        return this.func.uselesslog({
                            content: `${user!.tag} ${user} (\`${user!.id}\`) bumped on boticord.top`
                        });
                    };
                })
                .catch(() => null);
        },
        registerCommands: () => {
            const dev = !config.monitoring.bc;

            const commands = loadCommands();

            return dev
                ? this._client.guilds.cache.get("957937585299292192")!.commands.set(commands)
                : this._client.application.commands.set(commands);
        },
        getCommandMention: async (name: string) => {
            const dev = !config.monitoring.bc;

            const commands = dev
                ? await this._client.guilds.cache.get("957937585299292192")!.commands.fetch()
                : await this._client.application.commands.fetch();

            const root_name = name.split(" ")[0];
            const command = commands.find((c) => c.name === root_name);

            return `</${name}:${command?.id}>`;
        },
        uselesslog: (x: string | MessagePayload | WebhookMessageCreateOptions) => uselesswebhook.send(x)
    };

    public setClient(client: Client): Util {
        client.util = this;
        this._client = client;
        return this;
    };

    get client() {
        return this._client;
    };
};

export = new Util;