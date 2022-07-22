import { ButtonInteraction, Message, MessageType } from "discord.js";
import { deleteMessage } from "../../handlers/utils";
import buttonRoles from "../buttonroles";
import subscriptions from "../subscriptions";

export = async (interaction: ButtonInteraction) => {
    if (interaction.message.type === MessageType.ChatInputCommand) {
        if (interaction.user.id !== interaction.message.interaction.user.id) {
            return await interaction.reply({ content: "❌ Вы не можете использовать это.", ephemeral: true });
        };
    };

    if (interaction.customId == "reply:delete") return deleteMessage(interaction.message as Message);
    if (interaction.customId.startsWith("br:")) return await buttonRoles(interaction);
    if (["subscribe"].some((i) => interaction.customId.startsWith(i))) return await subscriptions(interaction);
};