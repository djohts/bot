import { ComponentType, GuildMember, SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Manage warns.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addSubcommand((c) =>
        c.setName("add").setDescription("Warn a user.")
            .addUserOption((u) => u.setName("user").setDescription("User.").setRequired(true))
            .addStringOption((s) => s.setName("reason").setDescription("Reason of the warn.").setMaxLength(256))
    )
    .addSubcommand((c) =>
        c.setName("list").setDescription("List all warnings.")
    )
    .addSubcommand((c) =>
        c.setName("remove").setDescription("Remove a warning.")
            .addStringOption((s) => s.setName("id").setDescription("Warn ID.").setRequired(true).setAutocomplete(true))
    )
    .toJSON();

import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    InteractionReplyOptions,
    InteractionUpdateOptions,
    ChatInputCommandInteraction
} from "discord.js";
import { paginate } from "../constants/resolvers";
import { getGuildDocument } from "../database";
import i18next from "i18next";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guild.id);
    const t = i18next.getFixedT(document.locale, null, "commands.warn");

    switch (interaction.options.getSubcommand()) {
        case "add":
            const user = interaction.options.getUser("user");
            const reason = interaction.options.getString("reason");

            if (user.id === interaction.user.id)
                return interaction.reply(t("add.sameuser"));

            const member = await interaction.guild.members.fetch(user.id).catch(() => false as false);
            if (
                member
                && member.roles.highest.rawPosition >= (interaction.member as GuildMember).roles.highest.rawPosition
            ) return interaction.reply(t("add.higher"));

            document.addWarn(user.id, interaction.user.id, reason);

            return interaction.reply({
                content: t("add.warned", { user: `${user}` }),
                allowedMentions: { parse: [] }
            });
        case "list":
            await interaction.deferReply();

            const warns = Array.from(document.warns.values());
            const users = await interaction.guild.members.fetch({
                user: [...warns.map((x) => x.userId), ...warns.map((x) => x.actionedById)],
                time: 1000 * 10
            }).catch(() => false as const);
            if (!users) return interaction.editReply(t("list.failed"));

            const mappedWarnings = warns
                .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
                .map(({ id, userId, actionedById, createdTimestamp, reason }) => {
                    const userTag = users.get(userId)?.user.tag.replace(/\*/g, "\\*") ?? "Unknown#0000";
                    const seconds = Math.round(createdTimestamp / 1000);

                    return [
                        `> \`${id}\` | <@${userId}> (**${userTag}**) | <@${actionedById}> | <t:${seconds}:f> (<t:${seconds}:R>)`,
                        `${reason ?? t("list.notspecified")}`
                    ].join("\n");
                });
            const pages = paginate(mappedWarnings, 5);
            let page = 0;

            await interaction.editReply({ content: null, ...generateMessage(pages, page, t) });

            const collector = (await interaction.fetchReply()).createMessageComponentCollector({
                filter: (i) => i.user.id === interaction.user.id,
                componentType: ComponentType.Button,
                time: 1000 * 60 * 5
            });

            collector.on("collect", async (i) => {
                if (i.customId === "warns:page:first") {
                    page = 0;
                    await i.update(generateMessage(pages, page, t));
                } else if (i.customId === "warns:page:prev") {
                    page -= 1;
                    await i.update(generateMessage(pages, page, t));
                } else if (i.customId === "warns:page:next") {
                    page += 1;
                    await i.update(generateMessage(pages, page, t));
                } else if (i.customId === "warns:page:last") {
                    page = pages.length - 1;
                    await i.update(generateMessage(pages, page, t));
                };
            });

            collector.on("end", async () => {
                await interaction.deleteReply().catch(() => 0);
            });
            return;
        case "remove":
            document.removeWarn(interaction.options.getString("id"));

            return interaction.reply(t("remove.removed"));
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
                .setTitle(t("list.title"))
                .setDescription(pages[page]?.join("\n") || t("list.empty"))
                .setFooter({ text: t("list.page", { page: `${page + 1}`, total: `${pages.length}` }) })
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>().setComponents([
                new ButtonBuilder().setCustomId("warns:page:first").setEmoji("⏮️").setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
                new ButtonBuilder().setCustomId("warns:page:prev").setEmoji("◀️").setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
                new ButtonBuilder().setCustomId("warns:page:next").setEmoji("▶️").setStyle(ButtonStyle.Secondary).setDisabled(pages.length - 1 <= page),
                new ButtonBuilder().setCustomId("warns:page:last").setEmoji("⏭️").setStyle(ButtonStyle.Secondary).setDisabled(pages.length - 1 <= page)
            ])
        ]
    };
};