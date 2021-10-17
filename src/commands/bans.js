module.exports = {
    name: "bans",
    permissionRequired: 1,
    opts: [
        {
            name: "add",
            description: "Забанить участника.",
            type: 1,
            options: [
                {
                    name: "user",
                    description: "Пользователь, которого надо забанить, или его ID.",
                    type: 6,
                    required: true
                },
                {
                    name: "time",
                    description: "Время, на которое участника надо забанить.",
                    type: 3
                },
                {
                    name: "reason",
                    description: "Причина выдачи бана.",
                    type: 3
                },
                {
                    name: "purgedays",
                    description: "Удаление сообщений пользователя за указанное время, в днях. От 0 до 7.",
                    type: 4
                }
            ]
        },
        {
            name: "remove",
            description: "Разбанить участника.",
            type: 1,
            options: [
                {
                    name: "user",
                    description: "Пользователь, которого надо разбанить, или его ID.",
                    type: 6,
                    required: true
                }
            ]
        }
    ],
    slash: true
};

const { CommandInteraction, MessageEmbed } = require("discord.js");
const { parseTime, getPermissionLevel, msToTime } = require("../constants/");
const db = require("../database/")();

module.exports.run = async (interaction = new CommandInteraction) => {
    if (!interaction.guild.me.permissions.has("BAN_MEMBERS"))
        return interaction.reply({ content: "❌ У меня нет прав для просмотра списка / выдачи и снятия банов.", ephemeral: true });
    if (interaction.options.getString("time")?.length && !parseTime(interaction.options.getString("time")))
        return interaction.reply({ content: "❌ Не удалось обработать указанное время.", ephemeral: true });

    const bans = await interaction.guild.bans.fetch();
    const guilddb = await db.guild(interaction.guild.id);
    const user = interaction.options.getUser("user");
    const member = interaction.options.getMember("user");

    switch (interaction.options.getSubcommand(true)) {
        case "add":
            if (guilddb.get().bans[user.id] && bans.has(user.id))
                return interaction.reply({ content: "❌ Этот пользователь уже забанен.", ephemeral: true });
            if (getPermissionLevel(member) >= 1)
                return interaction.reply({ content: "❌ Вы не можете забанить этого человека.", ephemeral: true });
            if (member && !member.bannable)
                return interaction.reply({ content: "❌ Не удалось забанить этого участника.", ephemeral: true });

            let dmsent = false;
            let time = 0;
            let reason = interaction.options.getString("reason");
            let purgedays = interaction.options.getInteger("purgedays");
            if (!interaction.options.getString("time")?.length) time = -1;
            else time = Date.now() + parseTime(interaction.options.getString("time"));
            if (purgedays < 0 || purgedays > 7) return interaction.reply({ content: "❌ `purgedays` должно быть от 0 до 7.", ephemeral: true });

            const dmemb = new MessageEmbed()
                .setAuthor(
                    interaction.guild.name,
                    interaction.guild.iconURL({ format: "png", dynamic: true }),
                    "https://discord.com/channels/" + interaction.guild.id
                )
                .setTitle("Вы были забанены")
                .addField("Модератор", `${interaction.user.toString()} (**${interaction.user.tag.replace("*", "\\*")}**)`, true);
            if (time != -1) dmemb.addField("Время", msToTime(parseTime(interaction.options.getString("time"))), true);
            if (reason.length) dmemb.addField("Причина", reason.trim());

            await user.send({ embeds: [dmemb] }).then(() => dmsent = true).catch(() => { });

            await interaction.guild.bans.create(user.id, {
                reason: interaction.user.tag + (reason.length ? ": " + reason : ""),
                days: purgedays
            }).then(() => {
                guilddb.setOnObject("bans", user.id, time);
            });

            return interaction.reply({
                content: `✅ ${user.toString()} был успешно забанен.` +
                    (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : "")
            });

        case "remove":
            if (!guilddb.get().bans[user.id] && !bans.has(user.id))
                return interaction.reply({ content: "❌ Этот участник не забанен.", ephemeral: true });

            interaction.guild.bans.remove(user.id).then(async () => {
                guilddb.removeFromObject("bans", interaction.options.getString("user"));
                await interaction.reply({ content: "✅ Юзер был успешно разбанен.", ephemeral: true });
            });
            break;
    };
};