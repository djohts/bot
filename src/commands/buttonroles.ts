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
            o.setName("id").setDescription("BR ID. Can be found in /buttonroles list").setRequired(true)
        )
    )
    .toJSON();

import {
    ButtonStyle,
    ComponentType,
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
import { generateID } from "../constants/";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guild.id);
    const _ = Util.i18n.getLocale(gdb.get().locale);
    const cmd = interaction.options.getSubcommand();

    if (cmd === "create") {
        const channel = interaction.options.getChannel("channel") as TextChannel;
        const messageId = interaction.options.getString("message");
        if (
            !channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel)
            || !channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ReadMessageHistory)
            || !channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)
        ) return interaction.reply({
            content: _("commands.buttonroles.create.noPerms", { perms: "`ViewChannel`, `ReadMessageHistory`, `SendMessages`" }),
            ephemeral: true
        });

        const role = interaction.options.getRole("role") as Role;
        if (
            role.rawPosition > interaction.guild.members.me.roles.highest.rawPosition
            || role.managed
            || interaction.guild.id === role.id
        ) return interaction.reply({
            content: _("commands.buttonroles.create.cantGive"),
            ephemeral: true
        });

        const emoji = interaction.options.getString("emoji").match(/\p{Extended_Pictographic}/ug)?.[0];
        if (!emoji) return interaction.reply({
            content: _("commands.buttonroles.create.invalidEmoji", { emoji: `\`${interaction.options.getString("emoji")}\`` }),
            ephemeral: true
        });

        await interaction.deferReply({ ephemeral: true }).catch(() => 0);
        const id = generateID();

        if (!messageId) return channel.send({
            embeds: [{
                title: _("commands.buttonroles.create.chooseRoles"),
                description: `${emoji} - ${role}`
            }],
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents([
                    new ButtonBuilder()
                        .setCustomId(`br:${id}`)
                        .setEmoji(emoji)
                        .setStyle(ButtonStyle.Danger)
                ])
            ]
        }).then((m) => {
            gdb.setOnObject("brcs", id, channel.id);
            gdb.setOnObject("brms", id, m.id);
            gdb.setOnObject("brs", id, role.id);

            interaction.editReply(_("commands.buttonroles.create.done"));
        });

        const message = await channel.messages.fetch(messageId).catch(() => 0 as const);
        if (!message || !Object.values(gdb.get().brms).includes(message.id))
            return interaction.editReply(_("commands.buttonroles.create.noMessage"));
        if (message.components[0].components.length >= 5)
            return interaction.editReply(_("commands.buttonroles.create.limitReached", { limit: "5" }));
        if (message.embeds[0].description.includes(role.id))
            return interaction.editReply(_("commands.buttonroles.create.alreadyExists"));

        (message.components[0].components as unknown as ButtonBuilder[]).push(
            new ButtonBuilder()
                .setCustomId(`br:${id}`)
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Danger)
        );
        const newMessage = {
            embeds: [{
                title: _("commands.buttonroles.create.chooseRoles"),
                description: message.embeds[0].description + `\n${emoji} - ${role}`
            }],
            components: [{
                type: 1,
                components: message.components[0].components
            }]
        };
        await message.edit(newMessage).then((m) => {
            gdb.setOnObject("brcs", id, channel.id);
            gdb.setOnObject("brms", id, m.id);
            gdb.setOnObject("brs", id, role.id);

            interaction.editReply(_("commands.buttonroles.create.done"));
        });
    } else if (cmd === "delete") {
        const brId = interaction.options.getString("id");
        const brc = gdb.get().brcs[brId];
        const brm = gdb.get().brms[brId];
        const br = gdb.get().brs[brId];

        await interaction.deferReply({ ephemeral: true }).catch(() => 0);

        const channel = interaction.guild.channels.cache.get(brc);
        if (
            !channel ||
            !(channel instanceof TextChannel)
        ) return interaction.editReply(_("commands.buttonroles.delete.deleted", { id: brId })).then(() => {
            gdb.removeFromObject("brcs", brId);
            gdb.removeFromObject("brms", brId);
            gdb.removeFromObject("brs", brId);
        });

        const message = await channel.messages.fetch(brm).catch(() => 0 as const);
        if (!message) return interaction.editReply(_("commands.buttonroles.delete.deleted", { id: brId })).then(() => {
            gdb.removeFromObject("brcs", brId);
            gdb.removeFromObject("brms", brId);
            gdb.removeFromObject("brs", brId);
        });

        const newMessage = {
            embeds: [{
                title: "Выбор роли",
                description: message.embeds[0].description.split("\n").filter((a) => !a.includes(br)).join("\n")
            }],
            components: [{
                type: 1,
                components: message.components[0].components.filter((a) => !a.customId.includes(brId))
            }]
        };
        if (
            !newMessage.embeds[0].description?.length ||
            !newMessage.components[0].components?.length
        ) return interaction.editReply(_("commands.buttonroles.delete.deleted", { id: brId })).then(() => {
            gdb.removeFromObject("brcs", brId);
            gdb.removeFromObject("brms", brId);
            gdb.removeFromObject("brs", brId);

            queueDelete([message]);
        });

        return message.edit(newMessage).then(() => {
            gdb.removeFromObject("brcs", brId);
            gdb.removeFromObject("brms", brId);
            gdb.removeFromObject("brs", brId);

            interaction.editReply(_("commands.buttonroles.delete.deleted", { id: brId }));
        });
    } else if (cmd === "list") {
        const { brcs: brcs1, brms: brms1, brs: brs1 } = gdb.get();
        const brcs = new Collection<string, string>();
        const brms = new Collection<string, string>();
        const brs = new Collection<string, string>();

        for (const key in brcs1) brcs.set(key, brcs1[key]);
        for (const key in brms1) brms.set(key, brms1[key]);
        for (const key in brs1) brs.set(key, brs1[key]);

        const channelObject = new Collection<string, typeof messageObject>();
        const messageObject = new Collection<string, string[]>();
        const channelIds = [...new Set(brcs.values())];

        channelIds.map((channelId) => {
            const channelBrIds = [...brcs.filter((v) => v === channelId).keys()];
            channelBrIds.map((i) => {
                const messageId = brms.get(i);
                const messageBrIds = [...brms.filter((v) => v === messageId).keys()];
                messageObject.set(messageId, brs.filter((_, x) => messageBrIds.includes(x)).map((roleId, brId) => `${brId}.${roleId}`));
            });
            channelObject.set(channelId, messageObject.filter((_, messageId) => channelBrIds.includes(brms.findKey((v) => v === messageId))));
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

        return interaction.reply({ ...generateMessage(paginated, page, _), fetchReply: true }).then((m) => {
            const collector = m.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: (x) => x.user.id === interaction.user.id,
                idle: 60 * 1000
            });

            collector.on("collect", (i) => {
                if (i.customId === "brlist:page:first") {
                    page = 0;
                    void i.update(generateMessage(paginated, page, _));
                } else if (i.customId === "brlist:page:prev") {
                    page--;
                    void i.update(generateMessage(paginated, page, _));
                } else if (i.customId === "brlist:page:next") {
                    page++;
                    void i.update(generateMessage(paginated, page, _));
                } else if (i.customId === "brlist:page:last") {
                    page = paginated.length - 1;
                    void i.update(generateMessage(paginated, page, _));
                };
            });
            collector.on("end", () => interaction.deleteReply().catch(() => null));
        });
    };
};

const generateMessage = (
    pages: string[][],
    page: number,
    _: (message: string, ...args: any) => string
): InteractionReplyOptions & InteractionUpdateOptions => {
    return {
        embeds: [
            new EmbedBuilder()
                .setTitle(_("commands.buttonroles.list.embedTitle"))
                .setDescription(pages[page]?.join("\n") || _("commands.buttonroles.list.empty"))
                .setFooter({ text: _("commands.buttonroles.list.embedTitle", { page: `${page + 1}`, total: `${pages.length}` }) })
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