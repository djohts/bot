"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
const database_1 = __importDefault(require("../database"));
exports.options = new builders_1.SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Размьютить участника.")
    .addUserOption((o) => o.setName("member").setDescription("Участник, у которого надо снять мьют.").setRequired(true))
    .toJSON();
exports.permission = 1;
const run = async (interaction) => {
    const guilddb = await database_1.default.guild(interaction.guild.id);
    const gsdb = await database_1.default.settings(interaction.guild.id);
    const role = interaction.guild.roles.cache.get(gsdb.get().muteRole);
    const member = interaction.options.getMember("member");
    const user = interaction.options.getUser("member");
    if (!role)
        return await interaction.reply({
            content: "❌ Не удалось найти роль мьюта.",
            ephemeral: true
        });
    if (!interaction.guild.me.permissions.has("MANAGE_ROLES") || !member.manageable)
        return await interaction.reply({
            content: "❌ У меня нет прав на изменение ролей.",
            ephemeral: true
        });
    if (interaction.guild.me.roles.highest.rawPosition <= role.rawPosition)
        return await interaction.reply({
            content: "❌ Роль мьюта находится выше моей.",
            ephemeral: true
        });
    if (!member.roles.cache.has(role.id))
        return await interaction.reply({
            content: "❌ Этот участник не замьючен.",
            ephemeral: true
        });
    let dmsent = false;
    await member.roles.remove(role).then(async () => {
        guilddb.removeFromObject("mutes", member.user.id);
        await interaction.reply({
            content: `✅ ${user} был успешно размьючен.` +
                (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : "")
        });
    }).catch(async (err) => {
        console.error(err);
        await interaction.reply({
            content: "❌ Произошла ошибка.",
            ephemeral: true
        });
    });
};
exports.run = run;
