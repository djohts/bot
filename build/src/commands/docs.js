"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const discord_js_1 = require("discord.js");
exports.options = new discord_js_1.SlashCommandBuilder()
    .setName("docs")
    .setDescription("Документация по использованию бота.")
    .toJSON();
exports.permission = 0;
const run = async (interaction) => {
    await interaction.reply({
        content: "Документация: https://djoh.gitbook.io/djoho-bot",
        ephemeral: true
    });
};
exports.run = run;
