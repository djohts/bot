module.exports = {
    name: "mute",
    description: "Замьютить участника.",
    permissionRequired: 1,
    opts: [{
        name: "member",
        description: "Участник, которому надо выдать мьют.",
        type: 6,
        required: true
    },
    {
        name: "time",
        description: "Время, на которое участнику надо выдать мьют.",
        type: 3
    },
    {
        name: "reason",
        description: "Причина выдачи мьюта.",
        type: 3
    }],
    slash: true
};

const { CommandInteraction } = require("discord.js");
const { parseTime, getPermissionLevel } = require("../constants/");
const db = require("../database/")();

module.exports.run = async (interaction = new CommandInteraction) => {
    if (!(interaction instanceof CommandInteraction)) return;

    const guilddb = await db.guild(interaction.guild.id);
    const gsdb = await db.settings(interaction.guild.id);
    const role = interaction.guild.roles.cache.get(gsdb.get().muteRole);
    const member = interaction.guild.members.resolve(interaction.options.getUser("member").id);

    if (!role) return interaction.editReply({ content: "❌ Не удалось найти роль мьюта.", ephemeral: true });
    if (!interaction.guild.me.permissions.has("MANAGE_ROLES"))
        return interaction.editReply({ content: "❌ У меня нет прав для изменения ролей.", ephemeral: true });
    if (interaction.guild.me.roles.cache.sort((a, b) => b.position - a.position).first().rawPosition <= role.rawPosition)
        return interaction.editReply({ content: "❌ Роль мьюта находится выше моей.", ephemeral: true });
    if (member.user.bot)
        return interaction.editReply({ content: "❌ Вы не можете замьютить бота.", ephemeral: true });
    if (getPermissionLevel(interaction.options.getMember("member")) >= 1)
        return interaction.editReply({ content: "❌ Вы не можете замьютить этого участника.", ephemeral: true });
    if (member.roles.cache.has(role.id))
        return interaction.editReply({ content: "❌ Этот участник уже замьючен.", ephemeral: true });
    if (interaction.options.getString("time")?.length && !parseTime(interaction.options.getString("time")))
        return interaction.editReply({ content: "❌ Не удалось обработать указанное время.", ephemeral: true });

    let dmsent = false;

    let time = 0;
    if (!interaction.options.getString("time")?.length) time = -1;
    else time = Date.now() + parseTime(interaction.options.getString("time"));

    interaction.options.getMember("member").roles.add(role).then(async () => {
        guilddb.setOnObject("mutes", interaction.options.getMember("member").user.id, time);
    }).catch((err) => {
        interaction.editReply({
            content: "❌ Произошла неизвестная ошибка.",
            ephemeral: true
        });
        console.error(err);
    });

    return await interaction.editReply({
        content: `✅ ${member.user.toString()} был успешно замьючен.` +
            (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : ""),
        ephemeral: (guilddb.get().channel == interaction.channel.id)
    });
};