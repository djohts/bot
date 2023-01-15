import { ButtonInteraction } from "discord.js";
import { getUserDocument } from "../database";

export = async (interaction: ButtonInteraction<"cached">) => {
    const document = await getUserDocument(interaction.user.id);
    const cmd = interaction.customId.split(":")[0];

    switch (cmd) {
        case "subscribe":
            if (document.subscriptions.includes("boticord"))
                return interaction.reply({ content: "❌ Вы уже подписаны на это.", ephemeral: true });

            document.subscribe("boticord");

            return interaction.reply({
                content: "✅ Успешно. Теперь вы будете получать уведомления о том, что пора поднимать бота в рейтинге каждые 4 часа",
                ephemeral: true
            });
    };
};