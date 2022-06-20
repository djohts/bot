"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const buttons_1 = __importDefault(require("./buttons"));
const slash_1 = __importDefault(require("./slash"));
const autocomplete_1 = __importDefault(require("./autocomplete"));
module.exports = (interaction) => {
    if (!interaction.guild ||
        !interaction.isCommand() &&
            !interaction.isButton() &&
            !interaction.isAutocomplete())
        return;
    if (interaction.client.loading &&
        (interaction.isCommand() ||
            interaction.isButton()))
        return interaction.reply({
            content: "🌀 Бот ещё запускается, подождите некоторое время...",
            ephemeral: true
        });
    if (interaction.isCommand())
        return (0, slash_1.default)(interaction);
    if (interaction.isButton())
        return (0, buttons_1.default)(interaction);
    if (interaction.isAutocomplete())
        return (0, autocomplete_1.default)(interaction);
};
