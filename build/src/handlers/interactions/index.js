"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const buttons_1 = __importDefault(require("./buttons"));
const slash_1 = __importDefault(require("./slash"));
const autocomplete_1 = __importDefault(require("./autocomplete"));
module.exports = async (interaction) => {
    if (interaction.type !== discord_js_1.InteractionType.ApplicationCommand &&
        !interaction.isButton() &&
        interaction.type !== discord_js_1.InteractionType.ApplicationCommandAutocomplete)
        return;
    if (interaction.client.loading &&
        (interaction.type === discord_js_1.InteractionType.ApplicationCommand ||
            interaction.isButton()))
        return await interaction.reply({
            content: "🌀 Бот ещё запускается, подождите некоторое время...",
            ephemeral: true
        });
    if (interaction instanceof discord_js_1.ChatInputCommandInteraction)
        return await (0, slash_1.default)(interaction);
    if (interaction.isButton())
        return await (0, buttons_1.default)(interaction);
    if (interaction.type === discord_js_1.InteractionType.ApplicationCommandAutocomplete)
        return await (0, autocomplete_1.default)(interaction);
};
