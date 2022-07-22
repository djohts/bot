import { ButtonInteraction, MessageType } from "discord.js";
import Util from "../util/Util";

export = async (interaction: ButtonInteraction) => {
    if (interaction.message.type === MessageType.Default) {
        if (interaction.user.id !== interaction.customId.split(":")[2]) {
            return await interaction.reply({ content: "❌ Вы не можете использовать это.", ephemeral: true });
        };
    };

    const udb = await Util.database.users(interaction.user.id);
    await udb.reload();

    const cmd = interaction.customId.split(":")[0];
    switch (cmd) {
        case "subscribe":
            if (udb.isSubscribed("boticord")) {
                return await interaction.reply({ content: "❌ Вы уже подписаны на это.", ephemeral: true });
            };
            udb.subscribe("boticord");
            return await interaction.reply({ content: "✅ Успешно. Теперь вы будете получать уведомления о том, что пора поднимать в рейтинге бота каждые 4 часа", ephemeral: true });
    };
};