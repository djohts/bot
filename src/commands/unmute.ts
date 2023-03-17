import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove timeout from a member.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addUserOption((o) => o.setName("member").setDescription("Member.").setRequired(true))
    .toJSON();

import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from "discord.js";
import { getGuildDocument } from "../database";
import i18next from "i18next";

export const run = async (interaction: ChatInputCommandInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT<any, any>(document.locale, null, "commands.unmute");
    const me = await interaction.guild.members.fetchMe();

    const member = interaction.options.getMember("member") as GuildMember;

    if (!me.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({ content: t("noperms"), ephemeral: true });
    if (!member.moderatable)
        return interaction.reply({ content: t("cantmod"), ephemeral: true });
    if (!member.isCommunicationDisabled())
        return interaction.reply({ content: t("nomute"), ephemeral: true });

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

    await member.user.send({ embeds: [dmemb] }).then(() => dmsent = true).catch(() => 0);

    return member.disableCommunicationUntil(null, interaction.user.tag).then(() => {
        return interaction.reply({
            content: t("unmuted", { user: `${member}` }) +
                (dmsent ? `\n[__${t("notified")}__]` : ""),
            allowedMentions: { parse: [] }
        });
    });
};