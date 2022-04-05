"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("play")
    .setDescription("Слушать музыку.")
    .addStringOption((o) => o.setName("query").setDescription("Трек, который вы хотите послушать.").setRequired(true))
    .toJSON();
exports.permission = 0;
const run = async (interaction) => {
    const client = interaction.client;
    const member = interaction.member;
    if (!member.voice.channel)
        return await interaction.reply({ content: "❌ Вы должны находится в голосовом канале.", ephemeral: true });
    if (interaction.guild.me.voice.channel &&
        member.voice.channel.id !== interaction.guild.me.voice.channel.id)
        return await interaction.reply({ content: "❌ Вы должны находится в том же голосовом канале, что и я.", ephemeral: true });
    await interaction.deferReply();
    const res = await client.manager.search(interaction.options.getString("query"), interaction.user);
    if (!res.tracks.length)
        return await interaction.editReply("❌ По вашему запросу не удалось ничего найти.");
    const player = client.manager.create({
        guild: interaction.guildId,
        voiceChannel: member.voice.channelId,
        textChannel: interaction.channelId,
        selfDeafen: true
    });
    if (player.state !== "CONNECTED") {
        player.connect();
        player.setVolume(20);
    }
    ;
    if (player.queue.totalSize + 1 > 25)
        return await interaction.editReply("❌ Размер очереди не может превышать 25 треков.");
    else
        player.queue.add(res.tracks[0]);
    await interaction.editReply(`Трек добавлен в очередь:\n\`${res.tracks[0].title}\``);
    if (!player.playing &&
        !player.paused &&
        (!player.queue.size || player.queue.totalSize === res.tracks.length))
        player.play();
};
exports.run = run;
