import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout a member.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addUserOption((o) => o.setName("member").setDescription("Member to mute.").setRequired(true))
    .addStringOption((o) => o.setName("time").setDescription("Mute duration. 28 days max.").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Mute reason."))
    .toJSON();

import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { parseTime } from "../constants/resolvers";
import { getGuildDocument } from "../database";
import i18next from "i18next";
import prettyms from "pretty-ms";

export const run = async (interaction: ChatInputCommandInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT<any, any>(document.locale, null, "commands.mute");
    const me = await interaction.guild.members.fetchMe();

    const member = interaction.options.getMember("member");
    const timeString = interaction.options.getString("time", true);
    const reason = interaction.options.getString("reason");

    const time = parseTime(timeString);

    if (!member)
        return interaction.reply({ content: t("nouser"), ephemeral: true });
    if (!me.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({ content: t("noperms"), ephemeral: true });
    if (!member.moderatable)
        return interaction.reply({ content: t("cantmod"), ephemeral: true });
    if (member.roles.highest.rawPosition >= (interaction.member as GuildMember).roles.highest.rawPosition)
        return interaction.reply({ content: t("cantmute"), ephemeral: true });
    if (!time || time > 28 * 24 * 60 * 60 * 1000)
        return interaction.reply({ content: t("time"), ephemeral: true });

    let dmsent = false;

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
    dmemb.addFields({
        name: t("dmEmbed.time"),
        value: `\`${prettyms(time)}\``,
        inline: true
    });
    if (reason) dmemb.addFields({
        name: t("dmEmbed.reason"),
        value: reason
    });

    await member.user.send({ embeds: [dmemb] }).then(() => dmsent = true).catch(() => 0);

    return member.disableCommunicationUntil(Date.now() + time, interaction.user.tag + (reason ? `: ${reason}` : "")).then((m) => {
        interaction.reply({
            content: t("muted", { user: `${m}` }) +
                (dmsent ? `\n[__${t("notified")}__]` : ""),
            allowedMentions: { parse: [] }
        });
    });
};