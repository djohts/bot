module.exports = {
    description: "Посмотреть задержку и аптайм бота.",
    permissionRequired: 0, // 0 All, 1 Admins, 2 Server Owner, 3 Bot Admin, 4 Bot Owner
    slash: true
};

const { CommandInteraction } = require("discord.js");

module.exports.run = async (interaction = new CommandInteraction) => {
    return await interaction.reply("pong");
};