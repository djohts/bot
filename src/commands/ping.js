module.exports = {
    name: "ping",
    description: "Посмотреть задержку и аптайм бота.",
    permissionRequired: 0,
    opts: [],
    slash: true
};

const { CommandInteraction } = require("discord.js");
const parseMs = require("pretty-ms");
const db = require("../database/")();

module.exports.run = async (interaction) => {
    if (!(interaction instanceof CommandInteraction)) return;

    const gdb = await db.guild(interaction.guild.id);

    return await interaction.reply({
        content: "💢 Получаю данные...",
        ephemeral: (gdb.get().channel == interaction.channel.id),
        fetchReply: true
    }).then(async (m) => {
        const uptime = parseMs(interaction.client.uptime);
        const api = Math.round(interaction.guild.shard.ping);
        const server = Date.now() - m.createdTimestamp;

        return await interaction.editReply({
            content: `🏓 Задержка сервера \`${server}ms\`, пинг API \`${api}ms\`, аптайм бота \`${uptime}\`.`
        });
    });
};