module.exports = {
    name: "unmute",
    description: "Размьютить участника.",
    permissionRequired: 1,
    opts: [
        {
            name: "member",
            description: "Участник, у которого надо снять мьют.",
            type: 6,
            required: true
        }
    ],
    slash: true
};

const { CommandInteraction } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction = new CommandInteraction) => {
    const guilddb = await db.settings(interaction.guild.id);
    const role = interaction.guild.roles.cache.get(guilddb.get().muteRole);
    const member = interaction.guild.members.resolve(interaction.options.getUser("member").id);
    const user = interaction.options.getUser("member").id;

    if (!role) return interaction.reply({ content: "❌ Не удалось найти роль мьюта.", ephemeral: true });
    if (!interaction.guild.me.permissions.has("MANAGE_ROLES"))
        return interaction.reply({ content: "❌ У меня нет прав для изменения ролей.", ephemeral: true });
    if (interaction.guild.me.roles.cache.sort((a, b) => b.position - a.position).first().rawPosition <= role.rawPosition)
        return interaction.reply({ content: "❌ Роль мьюта находится выше моей.", ephemeral: true });
    if (!member.roles.cache.has(role.id))
        return interaction.reply({ content: "❌ Этот участник не замьючен.", ephemeral: true });

    let dmsent = false;

    interaction.options.getMember("member").roles.remove(role).then(() => {
        guilddb.removeFromObject("mutes", member.user.id);
        interaction.reply({
            content: `✅ ${user.toString()} был успешно размьючен.` +
                (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : ""),
            ephemeral: true
        });
    }).catch((err) => {
        interaction.reply({
            content: "❌ Произошла неизвестная ошибка.",
            ephemeral: true
        });
        console.error(err);
    });
};