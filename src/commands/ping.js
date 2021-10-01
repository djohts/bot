module.exports = {
    name: "ping",
    description: "Посмотреть задержку и аптайм бота.",
    permissionRequired: 0,
    slash: true
};

const { CommandInteraction } = require("discord.js");
const { msToTime } = require("../constants/");

module.exports.run = async (interaction = new CommandInteraction) => {
    const uptime = msToTime(interaction.client.uptime);
    const api = Math.ceil(interaction.client.ws.ping);
    const server = Date.now() - interaction.createdTimestamp;

    return await interaction.reply(`🏓 Пинг сервера \`${server}ms\`, пинг API \`${api}ms\`, аптайм бота \`${uptime}\`.`);
};