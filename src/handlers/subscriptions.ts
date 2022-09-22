import { ButtonInteraction } from "discord.js";
import Util from "../util/Util";

export = async (interaction: ButtonInteraction) => {
    const udb = await Util.database.users(interaction.user.id);

    const cmd = interaction.customId.split(":")[0];
    switch (cmd) {
        case "subscribe":
            if (udb.isSubscribed("boticord")) {
                return interaction.reply({ content: "❌ Вы уже подписаны на это.", ephemeral: true });
            };
            udb.subscribe("boticord");
            return interaction.reply({ content: "✅ Успешно. Теперь вы будете получать уведомления о том, что пора поднимать в рейтинге бота каждые 4 часа", ephemeral: true });
    };
};