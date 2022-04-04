"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("volume")
    .setDescription("Установить громкость плеера.")
    .addIntegerOption((o) => o.setName("volume").setDescription("Новая громкость плеера.").setRequired(true).setMinValue(1).setMaxValue(200))
    .toJSON();
exports.permission = 0;
const run = async (interaction) => {
    const member = interaction.member;
    const client = interaction.client;
    const volume = interaction.options.getInteger("volume");
    if (!member.voice.channel)
        return await interaction.reply({
            content: "❌ Вы должны находится в голосовом канале.",
            ephemeral: true
        });
    if (interaction.guild.me.voice.channel &&
        member.voice.channel.id !== interaction.guild.me.voice.channel.id)
        return await interaction.reply({
            content: "❌ Вы должны находится в том же голосовом канале, что и я.",
            ephemeral: true
        });
    const player = client.manager.get(interaction.guildId);
    if (!player) {
        return await interaction.reply({
            content: "❌ На этом сервере ничего не играет.",
            ephemeral: true
        });
    }
    ;
    await interaction.reply(`Новая громкость - \`${volume}%\``).then(() => player.setVolume(volume));
};
exports.run = run;
