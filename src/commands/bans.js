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
                    name: "userid",
                    description: "ID пользователя, которого надо забанить.",
                    type: 3,
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
                }
            ]
        },
        {
            name: "remove",
            description: "Разбанить участника.",
            type: 1,
            options: [
                {
                    name: "userid",
                    description: "ID пользователя, которого надо разбанить.",
                    type: 3,
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
    const guilddb = await db.guild(interaction.guild.id);
    const bans = await interaction.guild.bans.fetch();
    const member = await interaction.guild.members.fetch(interaction.options.getString("userid")).catch(() => { });
    const user = await interaction.client.users.fetch(interaction.options.getString("userid")).catch(() => { });

    switch (interaction.options.getSubcommand(true)) {
        case "add":
            if (
                !interaction.guild.me.permissions.has("BAN_MEMBERS")
            ) return interaction.reply({ content: "❌ У меня нет права для выдачи бана.", ephemeral: true });
            if (
                guilddb.get().bans[interaction.options.getString("userid")] ||
                bans.has(interaction.options.getString("userid"))
            ) return interaction.reply({ content: "❌ Этот пользователь уже забанен.", ephemeral: true });
            if (
                getPermissionLevel(member) >= 1
            ) return interaction.reply({ content: "❌ Вы не можете забанить этого человека.", ephemeral: true });
            if (
                member &&
                !member.bannable
            ) return interaction.reply({ content: "❌ Не удалось забанить этого участника.", ephemeral: true });

            let dmsent = false;
            let time = 0;
            if (!interaction.options.getString("time")?.length) time = -1;
            else time = Date.now() + parseTime(interaction.options.getString("time"));

            const dmemb = new MessageEmbed()
                .setAuthor(
                    interaction.guild.name,
                    interaction.guild.iconURL({ format: "png", dynamic: true }),
                    "https://discord.com/channels/" + interaction.guild.id
                )
                .setTitle("Вы были забанены")
                .addField("Модератор", `${interaction.user.toString()} (**${interaction.user.tag.replace("*", "\\*")}**)`, true);
            if (time != -1) dmemb.addField("Время", msToTime(parseTime(interaction.options.getString("time"))), true);
            if (interaction.options.getString("reason")?.length) dmemb.addField("Причина", interaction.options.getString("reason"));

            await user.send({ embeds: [dmemb] }).then(() => dmsent = true).catch(() => { });

            await interaction.guild.bans.create(user.id).then(() => {
                guilddb.setOnObject("bans", user.id, time);
            });

            return interaction.reply({
                content: `✅ ${user.toString()} был успешно забанен.` +
                    (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : ""),
                ephemeral: true
            });

        case "remove":
            if (
                !guilddb.get().bans[interaction.options.getString("userid")]
            ) return interaction.reply({ content: "❌ Этот участник не забанен.", ephemeral: true });
            if (
                !interaction.guild.me.permissions.has("BAN_MEMBERS")
            ) return interaction.reply({ content: "❌ У меня нет прав для снятия банов.", ephemeral: true });

            interaction.guild.bans.remove(interaction.options.getString("userid")).then(async () => {
                guilddb.removeFromObject("bans", interaction.options.getString("userid"));
                await interaction.reply({ content: "✅ Юзер был успешно разбанен.", ephemeral: true });
            });
            break;
    };
};