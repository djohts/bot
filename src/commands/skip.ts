import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Пропустить текущий трек.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const member = interaction.member as GuildMember;

    if (!member.voice.channel)
        return interaction.reply({ content: "❌ Вы должны находится в голосовом канале.", ephemeral: true });
    if (
        interaction.guild.members.me.voice.channel
        && member.voice.channel.id !== interaction.guild.members.me.voice.channel.id
    ) return interaction.reply({ content: "❌ Вы должны находится в том же голосовом канале, что и я.", ephemeral: true });

    const player = Util.lava.get(interaction.guildId);
    if (!player)
        return interaction.reply({ content: "❌ На этом сервере ничего не играет.", ephemeral: true });

    await interaction.reply("Пропускаю текущий трек.").then(() => player.stop());
    setTimeout(() => interaction.deleteReply().catch(() => 0), 30 * 1000);
};