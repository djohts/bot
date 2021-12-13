module.exports = {
    name: "play",
    description: "Слушать музыку?",
    permissionRequired: 0,
    opts: [{
        name: "query",
        description: "Трек, который вы хотите послушать.",
        required: true,
        type: 3
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

    if (!interaction.member.voice.channelId) return interaction.reply({ content: "❌ Вы должны находится в голосовом канале.", ephemeral: true });
    if (
        interaction.guild.me.voice.channelId &&
        interaction.member.voice.channelId != interaction.guild.me.voice.channelId
    ) return interaction.reply({ content: "❌ Вы должны находится в том же голосовом канале, что и я.", ephemeral: true });
    await interaction.deferReply();

    const res = await client.manager.search(interaction.options.getString("query"), interaction.user);
    if (!res?.tracks[0]) return interaction.editReply("❌ По вашему запросу не удалось ничего найти.");

    const player = client.manager.create({
        guild: interaction.guildId,
        voiceChannel: interaction.member.voice.channelId,
        textChannel: interaction.channelId,
        selfDeafen: true
    });

    player.connect();
    if (player.queue.totalSize > 10) return interaction.editReply("❌ Размер очереди не может превышать 10 треков.");
    else player.queue.add(res.tracks[0]);
    interaction.editReply(`Трек добавлен в очередь:\n\`${res.tracks[0].title}\``);

    if (!player.playing && !player.paused && !player.queue.size) player.play();
    else if (
        !player.playing &&
        !player.paused &&
        player.queue.totalSize == res.tracks.length
    ) player.play();
};