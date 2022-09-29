import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set player volume.")
    .setDMPermission(false)
    .addIntegerOption((o) => o.setName("volume").setDescription("New volume.").setRequired(true).setMinValue(1).setMaxValue(200))
    .toJSON();

import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guildId);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    const member = interaction.member as GuildMember;
    const volume = interaction.options.getInteger("volume");

    if (!member.voice.channel)
        return interaction.reply({ content: _("commands.volume.novoice"), ephemeral: true });
    if (
        interaction.guild.members.me.voice.channel
        && member.voice.channel.id !== interaction.guild.members.me.voice.channel.id
    ) return interaction.reply({ content: _("commands.volume.notsame"), ephemeral: true });

    const player = Util.lava.get(interaction.guildId);
    if (!player)
        return interaction.reply({
            content: _("commands.volume.notplaying"),
            ephemeral: true
        });

    await interaction.reply(_("commands.volume.set", { volume: `${volume}%` })).then(() => player.setVolume(volume));
    setTimeout(() => interaction.deleteReply().catch(() => 0), 30 * 1000);
};