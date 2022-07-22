"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const Util_1 = __importDefault(require("../util/Util"));
module.exports = async (interaction) => {
    if (interaction.message.type === "DEFAULT") {
        if (interaction.user.id !== interaction.customId.split(":")[2]) {
            return await interaction.reply({ content: "❌ Вы не можете использовать это.", ephemeral: true });
        }
        ;
    }
    ;
    const udb = await Util_1.default.database.users(interaction.user.id);
    await udb.reload();
    const cmd = interaction.customId.split(":")[0];
    switch (cmd) {
        case "subscribe":
            if (udb.isSubscribed("boticord")) {
                return await interaction.reply({ content: "❌ Вы уже подписаны на это.", ephemeral: true });
            }
            ;
            udb.subscribe("boticord");
            return await interaction.reply({ content: "✅ Успешно. Теперь вы будете получать уведомления о том, что пора поднимать в рейтинге бота каждые 4 часа", ephemeral: true });
    }
    ;
};
