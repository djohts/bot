import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause the player.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guildId);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    const member = interaction.member as GuildMember;

    if (!member.voice.channel)
        return interaction.reply({ content: _("commands.loop.novoice"), ephemeral: true });
    if (
        interaction.guild.members.me.voice.channel
        && member.voice.channel.id !== interaction.guild.members.me.voice.channel.id
    ) return interaction.reply({ content: _("commands.loop.notsame"), ephemeral: true });

    const player = Util.lava.get(interaction.guildId);
    if (!player)
        return interaction.reply({
            content: _("commands.loop.notplaying"),
            ephemeral: true
        });

    player.paused
        ? await interaction.reply(_("commands.loop.disabled")).then(() => player.pause(false))
        : await interaction.reply(_("commands.loop.enabled")).then(() => player.pause(true));
    setTimeout(() => interaction.deleteReply().catch(() => null), 30 * 1000);
};