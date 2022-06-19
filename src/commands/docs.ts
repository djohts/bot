import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("docs")
    .setDescription("Документация по использованию бота.")
    .toJSON();
export const permission = 0;

import { CommandInteraction } from "discord.js";

export const run = async (interaction: CommandInteraction): Promise<any> => { };