const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    options: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Забанить участника.")
        .addUserOption((o) => o.setName("member").setDescription("Пользователь, которого надо забанить.").setRequired(true))
        .addStringOption((o) => o.setName("duration").setDescription("Время, на которое участник будет забанен."))
        .addStringOption((o) => o.setName("reason").setDescription("Причина выдачи бана."))
        .addIntegerOption((o) => o.setName("purgedays").setDescription("Удаление сообщений пользователя за указанное время, в днях.").setMaxValue(7).setMinValue(1))
        .toJSON(),
    permission: 1
};

const { CommandInteraction, MessageEmbed } = require("discord.js");
const { parseTime, getPermissionLevel } = require("../constants/");
const prettyms = require("pretty-ms");
const db = require("../database/")();

module.exports.run = async (interaction) => {
    if (!(interaction instanceof CommandInteraction)) return;

    if (!interaction.guild.me.permissions.has("BAN_MEMBERS"))
        return interaction.reply({ content: "❌ У меня нет прав для просмотра списка / выдачи банов.", ephemeral: true });
    if (interaction.options.getString("time")?.length && !parseTime(interaction.options.getString("time")))
        return interaction.reply({ content: "❌ Не удалось обработать указанное время.", ephemeral: true });

    const bans = await interaction.guild.bans.fetch();
    const guilddb = await db.guild(interaction.guild.id);
    const user = interaction.options.getUser("member");
    const member = interaction.options.getMember("member");

    if (guilddb.get().bans[user.id] && bans.has(user.id))
        return interaction.reply({ content: "❌ Этот пользователь уже забанен.", ephemeral: true });
    if (getPermissionLevel(member) >= 1)
        return interaction.reply({ content: "❌ Вы не можете забанить этого человека.", ephemeral: true });

    await interaction.deferReply();

    let dmsent = false;
    let time = 0;
    let reason = interaction.options.getString("reason")?.trim();
    let purgedays = interaction.options.getInteger("purgedays");
    if (!interaction.options.getString("time")?.length) time = -1;
    else time = Date.now() + parseTime(interaction.options.getString("time"));

    const dmemb = new MessageEmbed()
        .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true })
        })
        .setTitle("Вы были забанены")
        .addField("Модератор", `${interaction.user} (**${interaction.user.tag.replaceAll("*", "\\*")}**)`, true);
    if (time != -1) dmemb.addField("Время", prettyms(parseTime(interaction.options.getString("time"))), true);
    if (reason?.length) dmemb.addField("Причина", reason);

    await user.send({ embeds: [dmemb] }).then(() => dmsent = true).catch(() => false);

    await interaction.guild.bans.create(user.id, {
        reason: interaction.user.tag + (reason?.length ? ": " + reason : ""),
        days: purgedays
    }).then(() => {
        guilddb.setOnObject("bans", user.id, time);
    }).catch(() => {
        interaction.editReply({ content: "❌ Произошла неизвестная ошибка." });
    });

    return interaction.editReply({
        content: `✅ ${user} был успешно забанен.` +
            (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : "")
    });
};