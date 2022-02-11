const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    options: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Разбанить участника.")
        .addUserOption((o) => o.setName("user").setDescription("Пользователь, которого надо разбанить.").setRequired(true))
        .toJSON(),
    permission: 1
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