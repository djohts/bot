import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute a user.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addUserOption((o) => o.setName("member").setDescription("User to mute.").setRequired(true))
    .addStringOption((o) => o.setName("time").setDescription("Mute duration. 28 days max.").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Mute reason."))
    .toJSON();

import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from "discord.js";
import { parseTime } from "../constants/resolvers";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guildId);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    const member = interaction.options.getMember("member") as GuildMember;
    const timeString = interaction.options.getString("time");
    const reason = interaction.options.getString("reason");

    const time = parseTime(timeString);

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({ content: _("commands.mute.noperms"), ephemeral: true });
    if (!member.moderatable)
        return interaction.reply({ content: _("commands.mute.cantmod"), ephemeral: true });
    if (member.roles.highest.rawPosition >= (interaction.member as GuildMember).roles.highest.rawPosition)
        return interaction.reply({ content: _("commands.mute.cantmute"), ephemeral: true });
    if (!time || time > 28 * 24 * 60 * 60 * 1000)
        return interaction.reply({ content: _("commands.mute.time"), ephemeral: true });

    let dmsent = false;

    return member.disableCommunicationUntil(Date.now() + time, interaction.user.tag + (reason ? `: ${reason}` : "")).then((m) => {
        interaction.reply({
            content: _("commands.mute.muted", { user: `${m}` }) +
                (dmsent ? `\n[__${_("commands.mute.notified")}__]` : ""),
            allowedMentions: { parse: [] }
        });
    });
};