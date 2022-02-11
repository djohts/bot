const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    options: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("Установить громкость плеера.")
        .addIntegerOption((o) => o.setName("volume").setDescription("Новая громкость плеера.").setRequired(true).setMinValue(1).setMaxValue(200))
        .toJSON(),
    permission: 0
};

const { CommandInteraction } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction) => {
    if (!(interaction instanceof CommandInteraction)) return;
    const client = interaction.client;
    const gdb = await db.guild(interaction.guild.id);
    if (gdb.get().channel == interaction.channelId) return interaction.reply({ content: "❌ Эта команда недоступна в данном канале.", ephemeral: true });

    if (!interaction.member.voice.channel) return interaction.reply({ content: "❌ Вы должны находится в голосовом канале.", ephemeral: true });
    if (
        interaction.guild.me.voice.channel &&
        interaction.member.voice.channel.id != interaction.guild.me.voice.channel.id
    ) return interaction.reply({ content: "❌ Вы должны находится в том же голосовом канале, что и я.", ephemeral: true });

    const player = client.manager.get(interaction.guildId);
    if (!player) {
        return await interaction.reply({
            content: "❌ На этом сервере ничего не играет.",
            ephemeral: true
        });
    };

    return await interaction.reply(`Новая громкость - \`${interaction.options.getInteger("volume")}%\``).then(() =>
        player.setVolume(interaction.options.getInteger("volume"))
    );
};