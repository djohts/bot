import { queueDelete } from "../../handlers/utils";
import { ButtonInteraction } from "discord.js";
import subscriptions from "../subscriptions";
import buttonRoles from "../buttonroles";
import config from "../../../config";

export = (interaction: ButtonInteraction) => {
    if (interaction.customId === "reply:delete") {
        if (
            interaction.user.id !== interaction.message.interaction?.user.id
            && !config.admins.includes(interaction.user.id)
        ) return interaction.reply({ content: "❌ Вы не можете использовать это.", ephemeral: true });
        return queueDelete([interaction.message])
    };

    if (interaction.customId.startsWith("br:")) return buttonRoles(interaction);
    if (["subscribe"].some((i) => interaction.customId.startsWith(i))) return subscriptions(interaction);
};