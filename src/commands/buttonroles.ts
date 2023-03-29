import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("buttonroles")
    .setDescription("BR settings.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addSubcommand((c) =>
        c.setName("create").setDescription("Create new BR.").addChannelOption((o) =>
            o.setName("channel").setDescription("Channel in which the selection menu will be created.").setRequired(true).addChannelTypes(0, 5)
        )
            .addRoleOption((o) =>
                o.setName("role").setDescription("Role that will be given.").setRequired(true)
            )
            .addStringOption((o) =>
                o.setName("emoji").setDescription("Emoji.").setRequired(true)
            )
            .addStringOption((o) =>
                o.setName("message").setDescription("Message ID. Will send a new message if not specified.")
            )
    )
    .addSubcommand((c) => c.setName("list").setDescription("List of BR."))
    .addSubcommand((c) =>
        c.setName("delete").setDescription("Delete BR.").addStringOption((o) =>
            o.setName("id").setDescription("BR ID. Can be found in /buttonroles list").setRequired(true).setAutocomplete(true)
        )
    )
    .toJSON();

import {
    ButtonComponent,
    ButtonStyle,
    ComponentType,
    parseEmoji,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Collection,
    TextChannel,
    Role,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    InteractionReplyOptions,
    InteractionUpdateOptions
} from "discord.js";
import { paginate } from "../constants/resolvers";
import { queueDelete } from "../handlers/utils";
import { getGuildDocument } from "../database";
import { generateId } from "../constants/";
import limits from "../constants/limits";
import i18next from "i18next";

export const run = async (interaction: ChatInputCommandInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT<any, any>(document.locale, null, "commands.buttonroles");
    const cmd = interaction.options.getSubcommand();

    if (cmd === "create") {
        const channel = interaction.options.getChannel("channel") as TextChannel;
        const messageId = interaction.options.getString("message");
        const me = await interaction.guild.members.fetchMe();

        if (
            !channel.permissionsFor(me).has(PermissionFlagsBits.ViewChannel)
            || !channel.permissionsFor(me).has(PermissionFlagsBits.ReadMessageHistory)
            || !channel.permissionsFor(me).has(PermissionFlagsBits.SendMessages)
        ) return interaction.reply({
            content: t("create.noPerms", { perms: "`ViewChannel`, `ReadMessageHistory`, `SendMessages`" }),
            ephemeral: true
        });

        const role = interaction.options.getRole("role") as Role;
        if (
            role.rawPosition > me.roles.highest.rawPosition
            || role.managed
            || interaction.guildId === role.id
        ) return interaction.reply({
            content: t("create.cantGive"),
            ephemeral: true
        });

        const emoji = parseEmoji(interaction.options.getString("emoji", true));
        if (!emoji) return interaction.reply({
            content: t("create.invalidEmoji", { emoji: `\`${interaction.options.getString("emoji")}\`` }),
            ephemeral: true
        });

        await interaction.deferReply({ ephemeral: true }).catch(() => null);
        const id = generateId(6);

        if (!messageId) return channel.send({
            embeds: [{
                title: t("create.chooseRoles"),
                description: `${emoji.id ? `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>` : emoji.name} - ${role}`
            }],
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents([
                    new ButtonBuilder()
                        .setCustomId(`br:${id}`)
                        .setEmoji({
                            animated: emoji.animated,
                            name: emoji.name,
                            id: emoji.id ?? undefined
                        })
                        .setStyle(ButtonStyle.Danger)
                ])
            ]
        }).then((m) => {
            document.brcs.set(id, channel.id);
            document.brms.set(id, m.id);
            document.brs.set(id, role.id);

            document.safeSave();

            interaction.editReply(t("create.done"));
        });

        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message || !Array.from(document.brms.values()).includes(message.id))
            return interaction.editReply(t("create.noMessage"));
        if (message.components[0]!.components.length >= 5)
            return interaction.editReply(t("create.limitOnMessage", { count: limits.MAX_BUTTONROLES_MESSAGE }));
        if (message.embeds[0]!.description!.includes(role.id))
            return interaction.editReply(t("create.alreadyExists"));

        const row = new ActionRowBuilder<ButtonBuilder>()
            .setComponents(
                ...(message.components[0]!.components as ButtonComponent[]).map((x) => ButtonBuilder.from(x)),
                new ButtonBuilder()
                    .setCustomId(`br:${id}`)
                    .setEmoji({
                        animated: emoji.animated,
                        name: emoji.name,
                        id: emoji.id ?? undefined
                    })
                    .setStyle(ButtonStyle.Danger)
            );

        const newMessage = {
            embeds: [{
                title: t("create.chooseRoles"),
                description: message.embeds[0]!.description
                    + `\n${emoji.id ? `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>` : emoji.name} - ${role}`
            }],
            components: [row]
        };
        await message.edit(newMessage).then((m) => {
            document.brcs.set(id, channel.id);
            document.brms.set(id, m.id);
            document.brs.set(id, role.id);

            document.safeSave();

            interaction.editReply(t("create.done"));
        });
    } else if (cmd === "delete") {
        const brId = interaction.options.getString("id", true);
        const brc = document.brcs.get(brId)!;
        const brm = document.brms.get(brId)!;
        const br = document.brs.get(brId)!;

        await interaction.deferReply({ ephemeral: true }).catch(() => null);

        const channel = interaction.guild.channels.cache.get(brc);
        if (
            !channel ||
            !(channel instanceof TextChannel)
        ) return interaction.editReply(t("delete.deleted", { id: brId })).then(() => {
            document.brcs.delete(brId);
            document.brms.delete(brId);
            document.brs.delete(brId);

            document.safeSave();
        });

        const message = await channel.messages.fetch(brm).catch(() => null);
        if (!message) return interaction.editReply(t("delete.deleted", { id: brId })).then(() => {
            document.brcs.delete(brId);
            document.brms.delete(brId);
            document.brs.delete(brId);

            document.safeSave();
        });

        const row = new ActionRowBuilder<ButtonBuilder>()
            .setComponents(
                ...(message.components[0]!.components as ButtonComponent[])
                    .filter((x) => !x.customId!.includes(brId))
                    .map((x) => ButtonBuilder.from(x))
            );

        const newMessage = {
            embeds: [{
                title: t("create.chooseRoles"),
                description: message.embeds[0]!.description!.split("\n").filter((a) => !a.includes(br)).join("\n")
            }],
            components: [row]
        };

        if (
            !newMessage.embeds[0]!.description?.length ||
            !newMessage.components[0]!.components?.length
        ) return interaction.editReply(t("delete.deleted", { id: brId })).then(() => {
            document.brcs.delete(brId);
            document.brms.delete(brId);
            document.brs.delete(brId);

            document.safeSave();

            queueDelete([message]);
        });

        return message.edit(newMessage).then(() => {
            document.brcs.delete(brId);
            document.brms.delete(brId);
            document.brs.delete(brId);

            document.safeSave();

            interaction.editReply(t("delete.deleted", { id: brId }));
        });
    } else if (cmd === "list") {
        const { brcs, brms, brs } = document;

        const channelObject = new Collection<string, typeof messageObject>();
        const messageObject = new Collection<string, string[]>();
        const channelIds = [...new Set(brcs.values())];

        channelIds.map((channelId) => {
            const channelBrIds = [...Array.from(brcs).filter(([, v]) => v === channelId).map(([k]) => k)];

            channelBrIds.map((i) => {
                const messageId = brms.get(i)!;
                const messageBrIds = [...Array.from(brms).filter(([, v]) => v === messageId).map(([k]) => k)];

                messageObject.set(
                    messageId,
                    Array.from(brs).filter(([k]) => messageBrIds.includes(k)).map(([brId, roleId]) => `${brId}.${roleId}`)
                );
            });

            channelObject.set(channelId, messageObject.filter((_, messageId) =>
                channelBrIds.includes(Array.from(brms).find(([, v]) => v === messageId)![0])
            ));
        });

        const formattedArray = channelObject.map((messages, channelId) => {
            return `<#${channelId}>:\n` + messages.map((brList, messageId) => {
                return `**- \`${messageId}\`:**\n` + brList.map((x) => {
                    const a = x.split(".");
                    return `> \`${a[0]}\` - <@&${a[1]}> (\`${a[1]}\`)`;
                }).join("\n");
            }).join("\n");
        });
        const paginated = paginate(formattedArray, 1);
        let page = 0;

        return interaction.reply({ ...generateMessage(paginated, page, t), fetchReply: true }).then((m) => {
            const collector = m.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: (x) => x.user.id === interaction.user.id,
                time: 1000 * 60,
                idle: 1000 * 20
            });

            collector.on("collect", (i) => {
                if (i.customId === "brlist:page:first") {
                    page = 0;
                    void i.update(generateMessage(paginated, page, t));
                } else if (i.customId === "brlist:page:prev") {
                    page--;
                    void i.update(generateMessage(paginated, page, t));
                } else if (i.customId === "brlist:page:next") {
                    page++;
                    void i.update(generateMessage(paginated, page, t));
                } else if (i.customId === "brlist:page:last") {
                    page = paginated.length - 1;
                    void i.update(generateMessage(paginated, page, t));
                };
            });
            collector.on("end", () => void interaction.deleteReply().catch(() => null));
        });
    };
};

const generateMessage = (
    pages: string[][],
    page: number,
    t: (message: string, ...args: any) => string
): InteractionReplyOptions & InteractionUpdateOptions => {
    return {
        embeds: [
            new EmbedBuilder()
                .setTitle(t("list.embedTitle"))
                .setDescription(pages[page]?.join("\n") || t("list.empty"))
                .setFooter({ text: t("list.page", { page: `${page + 1}`, total: `${pages.length}` }) })
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>().setComponents([
                new ButtonBuilder().setCustomId("brlist:page:first").setEmoji("⏮️").setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
                new ButtonBuilder().setCustomId("brlist:page:prev").setEmoji("◀️").setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
                new ButtonBuilder().setCustomId("brlist:page:next").setEmoji("▶️").setStyle(ButtonStyle.Secondary).setDisabled(pages.length - 1 <= page),
                new ButtonBuilder().setCustomId("brlist:page:last").setEmoji("⏭️").setStyle(ButtonStyle.Secondary).setDisabled(pages.length - 1 <= page)
            ])
        ]
    };
};