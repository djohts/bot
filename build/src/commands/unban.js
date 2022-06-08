"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("unban")
    .setDescription("Разбанить участника.")
    .addUserOption((o) => o.setName("user").setDescription("Пользователь, которого надо разбанить.").setRequired(true))
    .toJSON();
exports.permission = 1;
const database_1 = __importDefault(require("../database"));
const run = async (interaction) => {
    if (!interaction.guild.me.permissions.has("BAN_MEMBERS"))
        return await interaction.reply({ content: "❌ У меня нет прав для просмотра списка / снятия банов.", ephemeral: true });
    const bans = await interaction.guild.bans.fetch();
    const gdb = await database_1.default.guild(interaction.guild.id);
    const user = interaction.options.getUser("user");
    if (!bans.has(user.id))
        return await interaction.reply({ content: "❌ Этот участник не забанен.", ephemeral: true })
            .then(() => gdb.removeFromObject("bans", user.id));
    await interaction.guild.bans.remove(user.id).then(async () => {
        gdb.removeFromObject("bans", user.id);
        await interaction.reply({ content: "✅ Юзер был успешно разбанен.", ephemeral: true });
    });
};
exports.run = run;
