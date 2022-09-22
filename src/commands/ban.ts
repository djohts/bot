import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the guild.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addUserOption((o) => o.setName("member").setDescription("User that needs to be banned.").setRequired(true))
    .addStringOption((o) => o.setName("duration").setDescription("Ban duration."))
    .addStringOption((o) => o.setName("reason").setDescription("Ban reason."))
    .addIntegerOption((o) => o.setName("purgedays").setDescription("Delete messages within this amount of days.").setMinValue(1).setMaxValue(7))
    .toJSON();

import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, EmbedBuilder } from "discord.js";
import { parseTime } from "../constants/resolvers";
import prettyms from "pretty-ms";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guild.id);
    const _ = Util.i18n.getLocale(gdb.get().locale);
    const user = interaction.options.getUser("member");

    if (
        !interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)
    ) return interaction.reply({ content: _("commands.ban.cannotBan"), ephemeral: true });
    if (
        interaction.options.getString("duration")
        && !parseTime(interaction.options.getString("duration"))
    ) return interaction.reply({ content: _("commands.ban.cannotParseTime"), ephemeral: true });

    await interaction.deferReply();

    if (await interaction.guild.bans.fetch(user).catch(() => 0))
        return interaction.editReply(_("commands.ban.alreadyBanned"));
    const member = await interaction.guild.members.fetch(user).catch(() => 0 as const);

    if (member) {
        if (member.roles.highest.rawPosition >= (interaction.member as GuildMember).roles.highest.rawPosition)
            return interaction.editReply(_("commands.ban.noPerm"));
        if (
            !member.manageable
        ) return interaction.editReply(_("commands.ban.cannotBan"));
    };

    let dmsent = false;
    let time = 0;
    const reason = interaction.options.getString("reason")?.trim();
    const deleteMessageDays = interaction.options.getInteger("purgedays");
    if (!interaction.options.getString("duration")) time = -1;
    else time = Date.now() + parseTime(interaction.options.getString("duration"));

    const dmemb = new EmbedBuilder()
        .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL()
        })
        .setTitle(_("commands.ban.dmEmbed.title"))
        .addFields({
            name: _("commands.ban.dmEmbed.staff"),
            value: `${interaction.user} (**${interaction.user.tag.replace(/\*/g, "\\*")}**)`,
            inline: true
        });
    if (time !== -1) dmemb.addFields({
        name: _("commands.ban.dmEmbed.time"),
        value: `\`${prettyms(parseTime(interaction.options.getString("duration")))}\``,
        inline: true
    });
    if (reason) dmemb.addFields({
        name: _("commands.ban.dmEmbed.reason"),
        value: reason
    });

    await user.send({ embeds: [dmemb] }).then(() => dmsent = true).catch(() => 0);

    await interaction.guild.bans.create(user, {
        reason: `${interaction.user.tag}: ${reason || _("commands.ban.notSpecified")}`,
        deleteMessageDays
    }).then(() => {
        if (time !== -1) gdb.setOnObject("bans", user.id, time);
        return interaction.editReply(_("commands.ban.success", { user: `${user}` }) + (dmsent ? "\n[__" + _("commands.ban.notified") + "__]" : ""));
    });
};