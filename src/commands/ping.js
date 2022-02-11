const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    options: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Посмотреть задержку бота.")
        .toJSON(),
    permission: 0
};

const db = require("../database/")();
const prettyms = require("pretty-ms");
const { CommandInteraction } = require("discord.js");

module.exports.run = async (interaction) => {
    if (!(interaction instanceof CommandInteraction)) return;

    const gdb = await db.guild(interaction.guild.id);
    const { channel } = gdb.get();

    await interaction.deferReply({
        ephemeral: interaction.channel.id == channel
    });

    const uptime = prettyms(interaction.client.uptime);
    const api = Math.ceil(interaction.guild.shard.ping);

    return await interaction.editReply({
        embeds: [{
            title: "🏓 Понг!",
            fields: [{
                name: "Сервер",
                value: `\`${Date.now() - interaction.createdTimestamp}ms\``
            }, {
                name: "API",
                value: `\`${api}ms\``
            }, {
                name: "Аптайм",
                value: `\`${uptime}\``
            }]
        }]
    });
};