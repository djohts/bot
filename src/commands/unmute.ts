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
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guild.id);
    const _ = Util.i18n.getLocale(document.locale);

    const member = interaction.options.getMember("member") as GuildMember;

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({ content: _("commands.unmute.noperms"), ephemeral: true });
    if (!member.moderatable)
        return interaction.reply({ content: _("commands.unmute.cantmod"), ephemeral: true });
    if (member.communicationDisabledUntil?.getTime() < Date.now())
        return interaction.reply({ content: _("commands.unmute.nomute"), ephemeral: true });

    let dmsent = false;

    return member.disableCommunicationUntil(null, interaction.user.tag).then(() => {
        return interaction.reply({
            content: _("commands.unmute.unmuted", { user: `${member}` }) +
                (dmsent ? `\n[__${_("commands.unmute.notified")}__]` : ""),
            allowedMentions: { parse: [] }
        });
    });
};