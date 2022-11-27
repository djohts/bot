import { getGuildDocument } from "../../database";
import { ButtonInteraction } from "discord.js";
import subscriptions from "../subscriptions";
import config from "../../constants/config";
import buttonRoles from "../buttonroles";
import i18next from "i18next";

export = async (interaction: ButtonInteraction) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT(document.locale, null, "handlers.interactions.buttons");

    if (interaction.customId === "reply:delete") {
        if (
            interaction.user.id !== interaction.message.interaction?.user.id
            && !config.admins.includes(interaction.user.id)
        ) return interaction.reply({ content: t("nouse"), ephemeral: true });
        return interaction.message.delete();
    };

    if (interaction.customId.startsWith("br:")) return buttonRoles(interaction);
    if (["subscribe"].some((i) => interaction.customId.startsWith(i))) return subscriptions(interaction);
};