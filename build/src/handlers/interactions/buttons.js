"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const utils_1 = require("../../handlers/utils");
const buttonroles_1 = __importDefault(require("../buttonroles"));
module.exports = async (interaction) => {
    if (interaction.message.type === "APPLICATION_COMMAND") {
        if (interaction.user.id !== interaction.message.interaction.user.id) {
            return await interaction.reply({ content: "❌ Вы не можете использовать это.", ephemeral: true });
        }
        ;
    }
    ;
    if (interaction.customId == "reply:delete")
        return (0, utils_1.deleteMessage)(interaction.message);
    if (interaction.customId.startsWith("br:"))
        return (0, buttonroles_1.default)(interaction);
};
