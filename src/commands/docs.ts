import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("docs")
    .setDescription("Документация по использованию бота.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";

export const run = (interaction: ChatInputCommandInteraction) => {
    return interaction.reply({
        content: "Документация: https://djoh.gitbook.io/djoho-bot",
        ephemeral: true
    })
};