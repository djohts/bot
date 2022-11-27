import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Counting leaderboard.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import { getGuildDocument } from "../database";
import { formatScore } from "../constants/";
import i18next from "i18next";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guild.id);
    const t = i18next.getFixedT(document.locale, null, "commands.leaderboard");
    const { scores } = document.counting;
    const sorted = Array.from(scores.keys()).sort((a, b) => scores.get(b) - scores.get(a));
    const top = sorted.slice(0, 25);
    const leaderboard = top.map((id, index) => formatScore(id, index, scores, interaction.user.id));
    let description = leaderboard.join("\n");

    if (!top.includes(interaction.user.id)) {
        if (leaderboard.length) description = description + "\n^^^^^^^^^^^^^^^^^^^^^^^^^\n";
        description = description + formatScore(interaction.user.id, sorted.indexOf(interaction.user.id), scores);
    };

    return interaction.reply({
        embeds: [{
            title: t("title"),
            description
        }]
    });
};