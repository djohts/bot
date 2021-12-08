module.exports = {
    name: "unban",
    description: "Разбанить участника.",
    permissionRequired: 1,
    opts: [{
        name: "user",
        description: "Пользователь, которого надо разбанить, или его ID.",
        type: 6,
        required: true
    }],
    slash: true
};

const { CommandInteraction } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction) => {
    if (!(interaction instanceof CommandInteraction)) return;

    if (!interaction.guild.me.permissions.has("BAN_MEMBERS"))
        return interaction.reply({ content: "❌ У меня нет прав для просмотра списка / снятия банов.", ephemeral: true });

    const bans = await interaction.guild.bans.fetch();
    const guilddb = await db.guild(interaction.guild.id);
    const user = interaction.options.getUser("user");

    if (!guilddb.get().bans[user.id] && !bans.has(user.id))
        return interaction.reply({ content: "❌ Этот участник не забанен.", ephemeral: true });

    interaction.guild.bans.remove(user.id).then(async () => {
        guilddb.removeFromObject("bans", user.id);
        await interaction.reply({ content: "✅ Юзер был успешно разбанен.", ephemeral: true });
    });
};