"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("mute")
    .setDescription("Замьютить участника.")
    .addUserOption((o) => o.setName("member").setDescription("Участник, которому надо выдать мьют.").setRequired(true))
    .addStringOption((o) => o.setName("time").setDescription("Время, на которое участнику надо выдать мьют."))
    .addStringOption((o) => o.setName("reason").setDescription("Причина выдачи мьюта."))
    .toJSON();
exports.permission = 1;
const constants_1 = require("../constants/");
const resolvers_1 = require("../constants/resolvers");
const database_1 = __importDefault(require("../database/"));
async function run(interaction) {
    const guilddb = await database_1.default.guild(interaction.guild.id);
    const gsdb = await database_1.default.settings(interaction.guild.id);
    const role = interaction.guild.roles.cache.get(gsdb.get().muteRole);
    const member = interaction.options.getMember("member");
    if (!role)
        return interaction.reply({ content: "❌ Не удалось найти роль мьюта.", ephemeral: true });
    if (!interaction.guild.me.permissions.has("MANAGE_ROLES"))
        return interaction.reply({ content: "❌ У меня нет прав для изменения ролей.", ephemeral: true });
    if (interaction.guild.me.roles.cache.sort((a, b) => b.position - a.position).first().rawPosition <= role.rawPosition)
        return interaction.reply({ content: "❌ Роль мьюта находится выше моей.", ephemeral: true });
    if (member.user.bot)
        return interaction.reply({ content: "❌ Вы не можете замьютить бота.", ephemeral: true });
    if ((0, constants_1.getPermissionLevel)(interaction.options.getMember("member")) >= 1)
        return interaction.reply({ content: "❌ Вы не можете замьютить этого участника.", ephemeral: true });
    if (member.roles.cache.has(role.id))
        return interaction.reply({ content: "❌ Этот участник уже замьючен.", ephemeral: true });
    if (interaction.options.getString("time")?.length && !(0, resolvers_1.parseTime)(interaction.options.getString("time")))
        return interaction.reply({ content: "❌ Не удалось обработать указанное время.", ephemeral: true });
    let dmsent = false;
    let time = 0;
    if (!interaction.options.getString("time")?.length)
        time = -1;
    else
        time = Date.now() + (0, resolvers_1.parseTime)(interaction.options.getString("time"));
    member.roles.add(role).then(async () => {
        guilddb.setOnObject("mutes", member.user.id, time);
    }).catch((err) => {
        interaction.reply({
            content: "❌ Произошла неизвестная ошибка.",
            ephemeral: true
        });
        console.error(err);
    });
    return await interaction.reply({
        content: `✅ ${member.user} был успешно замьючен.` +
            (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : ""),
        ephemeral: (guilddb.get().channel == interaction.channel.id)
    });
}
exports.run = run;
;
