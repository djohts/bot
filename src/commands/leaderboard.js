const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    options: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Список лидеров счёта.")
        .toJSON(),
    permission: 0
};

const db = require("../database/")();
const { CommandInteraction } = require("discord.js");
const { formatScore } = require("../constants/");

module.exports.run = async (interaction) => {
    if (!(interaction instanceof CommandInteraction)) return;

    const gdb = await db.guild(interaction.guild.id);
    const { users, channel } = gdb.get();
    const sorted = Object.keys(users).sort((a, b) => users[b] - users[a]);
    const top = sorted.slice(0, 25);
    const leaderboard = top.map((id, index) => formatScore(id, index, users, interaction.user.id));
    let description = leaderboard.join("\n");
    if (!top.includes(interaction.user.id)) {
        if (leaderboard.length) description = description + "\n^^^^^^^^^^^^^^^^^^^^^^^^^\n";
        description = description + formatScore(interaction.user.id, sorted.indexOf(interaction.user.id), users);
    };

    return interaction.reply({
        embeds: [{
            title: `Таблица лидеров ${interaction.guild.name}`,
            description
        }],
        ephemeral: (channel == interaction.channel.id)
    });
};