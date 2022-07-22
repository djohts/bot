"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const discord_js_1 = require("discord.js");
exports.options = new discord_js_1.SlashCommandBuilder()
    .setName("mute")
    .setDescription("Замьютить участника.")
    .addUserOption((o) => o.setName("member").setDescription("Участник, которому надо выдать мьют.").setRequired(true))
    .addStringOption((o) => o.setName("time").setDescription("Время, на которое участнику надо выдать мьют.").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Причина выдачи мьюта."))
    .toJSON();
exports.permission = 1;
const discord_js_2 = require("discord.js");
const constants_1 = require("../constants/");
const resolvers_1 = require("../constants/resolvers");
const run = async (interaction) => {
    const member = interaction.options.getMember("member");
    const timeString = interaction.options.getString("time");
    const reason = interaction.options.getString("reason");
    const time = (0, resolvers_1.parseTime)(timeString);
    if (!interaction.guild.members.me.permissions.has(discord_js_2.PermissionFlagsBits.ModerateMembers))
        return await interaction.reply({ content: "❌ У меня нет прав на модерирование участников.", ephemeral: true });
    if (!member.moderatable)
        return await interaction.reply({ content: "❌ Я не могу модерировать этого участника.", ephemeral: true });
    if (!time || time > 28 * 24 * 60 * 60 * 1000)
        return await interaction.reply({ content: "❌ Некорректное время.", ephemeral: true });
    if ((0, constants_1.getPermissionLevel)(member) >= (0, constants_1.getPermissionLevel)(interaction.member))
        return await interaction.reply({ content: "❌ Вы не можете замьютить этого участника.", ephemeral: true });
    let dmsent = false;
    await member.disableCommunicationUntil(Date.now() + time, interaction.user.tag + (reason ? `: ${reason}` : "")).then(async (m) => {
        await interaction.reply({
            content: `✅ ${m.user} был успешно замьючен.` +
                (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : ""),
            allowedMentions: { parse: [] }
        });
    }).catch(async (e) => {
        console.error(e);
        await interaction.reply({ content: "❌ Произошла ошибка.", ephemeral: true });
    });
};
exports.run = run;
