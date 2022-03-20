import { ButtonInteraction, Message } from "discord.js";
import { deleteMessage } from "../../handlers/utils";
import buttonRoles from "../buttonroles";

export = async (interaction: ButtonInteraction) => {
    if (interaction.message.type == "APPLICATION_COMMAND") {
        if (interaction.user.id != interaction.message.interaction.user.id) {
            return await interaction.reply({ content: "❌ Вы не можете использовать это.", ephemeral: true });
        };
    };

    if (interaction.customId == "reply:delete") return deleteMessage(interaction.message as Message);

    if (interaction.customId.startsWith("br:")) return buttonRoles(interaction);
};