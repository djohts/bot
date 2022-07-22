import {  SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("docs")
    .setDescription("Документация по использованию бота.")
    .toJSON();
export const permission = 0;

import { ChatInputCommandInteraction } from "discord.js";

export const run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply({
        content: "Документация: https://djoh.gitbook.io/djoho-bot",
        ephemeral: true
    })
};