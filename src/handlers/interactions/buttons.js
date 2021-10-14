const { ButtonInteraction } = require("discord.js");
const { deleteMessage } = require("../../handlers/utils");
const config = require("../../../config");

module.exports = async (interaction = new ButtonInteraction) => {
    if (interaction.customId == "reply:delete") {
        if (["DEFAULT", "REPLY"].includes(interaction.message.type)) {
            if (
                interaction.user.id != (await interaction.channel.messages.fetch(interaction.message.reference.messageId).then((m) => m.author.id))
            ) return interaction.reply({ content: "❌ Вы не можете использовать это.", ephemeral: true });
            return deleteMessage(interaction.message);
        };
        if (interaction.message.type == "APPLICATION_COMMAND") {
            if (
                interaction.user.id != interaction.message.interaction.user.id
            ) return interaction.reply({ content: "❌ Вы не можете использовать это.", ephemeral: true });
            return deleteMessage(interaction.message);
        };
    };
};