"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const discord_js_1 = require("discord.js");
exports.options = new discord_js_1.SlashCommandBuilder()
    .setName("unban")
    .setDescription("Разбанить участника.")
    .addUserOption((o) => o.setName("user").setDescription("Пользователь, которого надо разбанить.").setRequired(true))
    .toJSON();
exports.permission = 1;
const discord_js_2 = require("discord.js");
const Util_1 = __importDefault(require("../util/Util"));
const run = async (interaction) => {
    if (!interaction.guild.members.me.permissions.has(discord_js_2.PermissionFlagsBits.BanMembers))
        return await interaction.reply({ content: "❌ У меня нет прав для просмотра списка / снятия банов.", ephemeral: true });
    const gdb = await Util_1.default.database.guild(interaction.guild.id);
    const user = interaction.options.getUser("user");
    if (!(await interaction.guild.bans.fetch(user).catch(() => 0)))
        return await interaction.reply({ content: "❌ Этот участник не забанен.", ephemeral: true })
            .then(() => gdb.removeFromObject("bans", user.id));
    await interaction.guild.bans.remove(user.id).then(async () => {
        gdb.removeFromObject("bans", user.id);
        await interaction.reply({ content: "✅ Юзер был успешно разбанен.", ephemeral: true });
    });
};
exports.run = run;
