module.exports = {
    name: "volume",
    description: "Установить громкость плеера?",
    permissionRequired: 0,
    opts: [{
        name: "volume",
        description: "Громкость.",
        type: 4,
        required: true,
        min_value: 1,
        max_value: 100
    }],
    slash: true
};

const { CommandInteraction } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction) => {
    if (!(interaction instanceof CommandInteraction)) return;
    const client = interaction.client;
    const gdb = await db.guild(interaction.guild.id);
    if (gdb.get().channel == interaction.channelId) return interaction.reply({ content: "❌ Эта команда недоступна в данном канале.", ephemeral: true });
    await interaction.deferReply();

    if (
        interaction.guild.me.voice.channelId &&
        !interaction.guild.me.voice?.channel?.equals(interaction.member.voice.channel)
    ) return interaction.editReply("❌ Вы должны находится в том же голосовом канале, что и я.");

    const player = client.manager.create({
        guild: interaction.guildId,
        voiceChannel: interaction.member.voice.channelId,
        textChannel: interaction.channelId,
        selfDeafen: true
    });

    if (player.playing) {
        interaction.editReply(`Новая громкость - \`${interaction.options.getInteger("volume")}%\``);
        player.setVolume(interaction.options.getInteger("volume"));
    } else interaction.editReply("❌ Плеер на паузе или не играет.");
};