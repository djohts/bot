import { queueDelete } from "../../handlers/utils";
import { ButtonInteraction } from "discord.js";
import subscriptions from "../subscriptions";
import buttonRoles from "../buttonroles";
import config from "../../../config";
import Util from "../../util/Util";

export = async (interaction: ButtonInteraction) => {
    const gdb = await Util.database.guild(interaction.guildId);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    if (interaction.customId === "reply:delete") {
        if (
            interaction.user.id !== interaction.message.interaction?.user.id
            && !config.admins.includes(interaction.user.id)
        ) return interaction.reply({ content: _("handlers.interactions.buttons.nouse"), ephemeral: true });
        return queueDelete([interaction.message])
    };

    if (interaction.customId.startsWith("br:")) return buttonRoles(interaction);
    if (["subscribe"].some((i) => interaction.customId.startsWith(i))) return subscriptions(interaction);
};