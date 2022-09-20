import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("play")
    .setDescription("Queue a track.")
    .setDMPermission(false)
    .addStringOption((o) => o.setName("query").setDescription("Track to search.").setRequired(true))
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

    await interaction.deferReply();

    const res = await Util.lava.search(interaction.options.getString("query").trim(), interaction.user);
    if (!res.tracks.length) {
        await interaction.editReply(_("commands.loop.notfound"));
        setTimeout(() => interaction.deleteReply().catch(() => null), 20 * 1000);
        return;
    };

    const player = Util.lava.create({
        guild: interaction.guildId,
        voiceChannel: member.voice.channelId,
        textChannel: interaction.channelId,
        selfDeafen: true,
        volume: 20
    });
    if (
        player.state !== "CONNECTED"
        && player.state !== "CONNECTING"
    ) player.connect();

    const queueLimit = 15;

    if (player.queue.totalSize + 1 > queueLimit) {
        await interaction.editReply(_("commands.loop.limit", { amount: `${queueLimit}` }));
        setTimeout(() => interaction.deleteReply().catch(() => null), 20 * 1000);
        return;
    } else player.queue.add(res.tracks[0]);
    await interaction.editReply(_("commands.loop.queued", { track: `${res.tracks[0].title}` }));

    if (
        !player.playing
        && !player.paused
        && (!player.queue.size || player.queue.totalSize === res.tracks.length)
    ) player.play();
    setTimeout(() => interaction.deleteReply().catch(() => null), 20 * 1000);
};