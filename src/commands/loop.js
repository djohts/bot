module.exports = {
    name: "loop",
    description: "Поставить трек на повтор?",
    permissionRequired: 0,
    opts: [],
    slash: true
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
    await interaction.deferReply();

    const player = client.manager.create({
        guild: interaction.guildId
    });

    if (player.playing || player.queue.totalSize) {
        player.trackRepeat ? (() => {
            player.setTrackRepeat(false);
            interaction.editReply("Повтор выключен.");
        })() : (() => {
            player.setTrackRepeat(true);
            interaction.editReply("Повтор включён.");
        })();
    } else interaction.editReply("❌ Плеер на паузе или не играет.") && player.destroy();
};