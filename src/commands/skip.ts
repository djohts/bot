import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Пропустить текущий трек.")
    .toJSON();
export const permission = 0;

import { CommandInteraction, GuildMember } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: CommandInteraction): Promise<any> => {
    const member = interaction.member as GuildMember;

    if (!member.voice.channel)
        return await interaction.reply({ content: "❌ Вы должны находится в голосовом канале.", ephemeral: true });
    if (
        interaction.guild.me.voice.channel &&
        member.voice.channel.id !== interaction.guild.me.voice.channel.id
    ) return await interaction.reply({ content: "❌ Вы должны находится в том же голосовом канале, что и я.", ephemeral: true });

    const player = Util.lava.get(interaction.guildId);
    if (!player) {
        return await interaction.reply({ content: "❌ На этом сервере ничего не играет.", ephemeral: true });
    };

    await interaction.reply("Пропускаю текущий трек.").then(() => player.stop());
};