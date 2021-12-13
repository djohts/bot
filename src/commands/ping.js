module.exports = {
    name: "ping",
    description: "Посмотреть задержку и аптайм бота.",
    permissionRequired: 0,
    opts: [],
    slash: true
};

const { CommandInteraction } = require("discord.js");
const { msToTime } = require("../constants/");
const db = require("../database/")();

module.exports.run = async (interaction) => {
    if (!(interaction instanceof CommandInteraction)) return;

    const gdb = await db.guild(interaction.guild.id);
    const uptime = msToTime(interaction.client.uptime);
    const api = Math.round(interaction.client.ws.ping);
    const server = Date.now() - interaction.createdTimestamp;

    return await interaction.reply({
        content: `🏓 Задержка сервера \`${server}ms\`, пинг API \`${api}ms\`, аптайм бота \`${uptime}\`.`,
        ephemeral: (gdb.get().channel == interaction.channel.id)
    });
};