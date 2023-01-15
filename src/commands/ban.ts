import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the guild.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addUserOption((o) => o.setName("user").setDescription("User that needs to be banned.").setRequired(true))
    .addStringOption((o) => o.setName("duration").setDescription("Ban duration."))
    .addStringOption((o) => o.setName("reason").setDescription("Ban reason."))
    .addIntegerOption((o) => o.setName("purgedays").setDescription("Delete messages within this amount of days.").setMinValue(1).setMaxValue(7))
    .toJSON();

import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, EmbedBuilder } from "discord.js";
import { parseTime } from "../constants/resolvers";
import { getGuildDocument } from "../database";
import prettyms from "pretty-ms";
import i18next from "i18next";

export const run = async (interaction: ChatInputCommandInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT<any, any>(document.locale, null, "commands.ban");
    const me = await interaction.guild.members.fetchMe();
    const user = interaction.options.getUser("user", true);

    if (!me.permissions.has(PermissionFlagsBits.BanMembers))
        return interaction.reply({ content: t("cannotBan"), ephemeral: true });
    const duration = interaction.options.getString("duration");
    if (duration && !parseTime(duration))
        return interaction.reply({ content: t("cannotParseTime"), ephemeral: true });

    await interaction.deferReply();

    if (await interaction.guild.bans.fetch(user).catch(() => 0))
        return interaction.editReply(t("alreadyBanned"));
    const member = await interaction.guild.members.fetch(user).catch(() => 0 as const);

    if (member) {
        if (member.roles.highest.rawPosition >= (interaction.member as GuildMember).roles.highest.rawPosition)
            return interaction.editReply(t("noPerm"));
        if (
            !member.manageable
        ) return interaction.editReply(t("cannotBan"));
    };

    let dmsent = false;
    let time = 0;
    const reason = interaction.options.getString("reason")?.trim();
    const deleteMessageDays = interaction.options.getInteger("purgedays");

    if (!duration) time = -1;
    else time = Date.now() + parseTime(duration);

    const dmemb = new EmbedBuilder()
        .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL() ?? ""
        })
        .setTitle(t("dmEmbed.title"))
        .addFields({
            name: t("dmEmbed.staff"),
            value: `${interaction.user} (**${interaction.user.tag.replace(/\*/g, "\\*")}**)`,
            inline: true
        });
    if (time !== -1 && duration) dmemb.addFields({
        name: t("dmEmbed.time"),
        value: `\`${prettyms(parseTime(duration))}\``,
        inline: true
    });
    if (reason) dmemb.addFields({
        name: t("dmEmbed.reason"),
        value: reason
    });

    await user.send({ embeds: [dmemb] }).then(() => dmsent = true).catch(() => 0);

    await interaction.guild.bans.create(user, {
        reason: `${interaction.user.tag}: ${reason || t("notSpecified")}`,
        deleteMessageDays: deleteMessageDays ?? undefined
    }).then(() => {
        document.bans.set(user.id, { userId: user.id, createdTimestamp: Date.now(), expiresTimestamp: time });
        document.safeSave();

        return interaction.editReply(t("success", { user: `${user}` }) + (dmsent ? `\n[__${t("notified")}__]` : ""));
    });
};