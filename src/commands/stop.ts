import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import { ModifiedClient } from "../constants/types";
import db from "../database/";

export const options = new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Остановить плеер.")
    .toJSON();
export const permission = 0;

export const run = async (interaction: CommandInteraction): Promise<any> => {
    const client = interaction.client as ModifiedClient;
    const member = interaction.member as GuildMember;
    const gdb = await db.guild(interaction.guild.id);

    if (!member.voice.channel)
        return await interaction.reply({ content: "❌ Вы должны находится в голосовом канале.", ephemeral: true });
    if (
        interaction.guild.me.voice.channel &&
        member.voice.channel.id !== interaction.guild.me.voice.channel.id
    ) return await interaction.reply({ content: "❌ Вы должны находится в том же голосовом канале, что и я.", ephemeral: true });

    const player = client.manager.get(interaction.guildId);
    if (!player) {
        return await interaction.reply({ content: "❌ На этом сервере ничего не играет.", ephemeral: true });
    };

    await interaction.reply("Плеер был остановлен.").then(() => player.destroy());
};