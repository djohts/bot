"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("exec")
    .setDescription("Execute bash script.")
    .addStringOption((o) => o.setName("script").setDescription("Bash script that'd be ran.").setRequired(true))
    .toJSON();
exports.permission = 4;
const child_process_1 = require("child_process");
const run = async (interaction) => {
    await interaction.deferReply();
    (0, child_process_1.exec)(interaction.options.getString("script"), async (error, stdout) => {
        return await interaction.editReply(`\`\`\`\n${(error || stdout).toString().slice(0, 1990)}\n\`\`\``);
    });
};
exports.run = run;
