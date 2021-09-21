module.exports = {
    description: "Посмотреть задержку и аптайм бота.",
    permissionRequired: 0, // 0 All, 1 Admins, 2 Server Owner, 3 Bot Admin, 4 Bot Owner
    slash: true
};

const { CommandInteraction } = require("discord.js");
const { msToTime } = require("../constants/");

module.exports.run = async (interaction = new CommandInteraction) => {
    const uptime = msToTime(interaction.client.uptime);
    const api = Math.ceil(interaction.client.ws.ping);
    const server = Date.now() - interaction.createdTimestamp;

    return await interaction.reply(`🏓 Пинг сервера \`${server}\`, пинг API \`${api}\`, аптайм бота \`${uptime}\`.`);
};