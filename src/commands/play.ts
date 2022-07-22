import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("play")
    .setDescription("Слушать музыку.")
    .addStringOption((o) => o.setName("query").setDescription("Трек, который вы хотите послушать.").setRequired(true))
    .toJSON();
export const permission = 0;

import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const member = interaction.member as GuildMember;

    if (!member.voice.channel)
        return await interaction.reply("❌ Вы должны находиться в голосовом канале.");
    if (
        interaction.guild.members.me.voice.channel &&
        member.voice.channel?.id !== interaction.guild.members.me.voice.channel?.id
    ) return await interaction.reply({ content: "❌ Вы должны находится в том же голосовом канале, что и я.", ephemeral: true });

    await interaction.deferReply();

    const res = await Util.lava.search(interaction.options.getString("query").trim(), interaction.user);
    if (!res.tracks.length) {
        await interaction.editReply("❌ По вашему запросу не удалось ничего найти.");
        setTimeout(async () => await interaction.deleteReply().catch(() => { }), 20 * 1000);
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
        player.state !== "CONNECTED" &&
        player.state !== "CONNECTING"
    ) {
        player.connect();
    };

    if (player.queue.totalSize + 1 > 25) {
        await interaction.editReply("❌ Размер очереди не может превышать 25 треков.");
        setTimeout(async () => await interaction.deleteReply().catch(() => { }), 20 * 1000);
        return;
    } else player.queue.add(res.tracks[0]);
    await interaction.editReply(`Трек добавлен в очередь:\n\`${res.tracks[0].title}\``);

    if (
        !player.playing &&
        !player.paused &&
        (!player.queue.size || player.queue.totalSize === res.tracks.length)
    ) player.play();
    setTimeout(async () => await interaction.deleteReply().catch(() => { }), 20 * 1000);
};