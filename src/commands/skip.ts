import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip current track.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guildId);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    const member = interaction.member as GuildMember;

    if (!member.voice.channel)
        return interaction.reply({ content: _("commands.skip.novoice"), ephemeral: true });
    if (
        interaction.guild.members.me.voice.channel
        && member.voice.channel.id !== interaction.guild.members.me.voice.channel.id
    ) return interaction.reply({ content: _("commands.skip.notsame"), ephemeral: true });

    const player = Util.lava.get(interaction.guildId);
    if (!player)
        return interaction.reply({
            content: _("commands.skip.notplaying"),
            ephemeral: true
        });

    await interaction.reply(_("commands.skip.skipped")).then(() => player.stop());
    setTimeout(() => interaction.deleteReply().catch(() => 0), 30 * 1000);
};