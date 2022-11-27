import { SlashCommandBuilder } from "discord.js";

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

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guild.id);
    const t = i18next.getFixedT(document.locale, null, "commands.unmute");

    const member = interaction.options.getMember("member") as GuildMember;

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({ content: t("noperms"), ephemeral: true });
    if (!member.moderatable)
        return interaction.reply({ content: t("cantmod"), ephemeral: true });
    if (member.communicationDisabledUntil?.getTime() < Date.now())
        return interaction.reply({ content: t("nomute"), ephemeral: true });

    let dmsent = false;

    return member.disableCommunicationUntil(null, interaction.user.tag).then(() => {
        return interaction.reply({
            content: t("unmuted", { user: `${member}` }) +
                (dmsent ? `\n[__${t("notified")}__]` : ""),
            allowedMentions: { parse: [] }
        });
    });
};