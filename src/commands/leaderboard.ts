import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Список лидеров счёта.")
    .toJSON();
export const permission = 0

import db from "../database/";
import { CommandInteraction } from "discord.js";
import { formatScore } from "../constants/";

export const run = async (interaction: CommandInteraction) => {
    const gdb = await db.guild(interaction.guild.id);
    const { users, channel } = gdb.get();
    const sorted = Object.keys(users).sort((a, b) => users[b] - users[a]);
    const top = sorted.slice(0, 25);
    const leaderboard = top.map((id, index) => formatScore(id, index, users, interaction.user.id));
    let description = leaderboard.join("\n");
    if (!top.includes(interaction.user.id)) {
        if (leaderboard.length) description = description + "\n^^^^^^^^^^^^^^^^^^^^^^^^^\n";
        description = description + formatScore(interaction.user.id, sorted.indexOf(interaction.user.id), users);
    };

    await interaction.reply({
        embeds: [{
            title: `Таблица лидеров ${interaction.guild.name}`,
            description
        }],
        ephemeral: (channel === interaction.channel.id)
    });
};