import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("exec")
    .setDescription("Execute bash script.")
    .setDefaultMemberPermissions(0)
    .setDMPermission(false)
    .addStringOption((o) => o.setName("script").setDescription("Bash script that'd be ran.").setRequired(true))
    .toJSON();
export const permission = 4;

import { exec } from "child_process";
import { ChatInputCommandInteraction } from "discord.js";

export const run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();

    exec(interaction.options.getString("script"), (error, stdout) => {
        return interaction.editReply(`\`\`\`\n${(error || stdout).toString().slice(0, 1990)}\n\`\`\``);
    });
};