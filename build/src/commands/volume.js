"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
const database_1 = __importDefault(require("../database/"));
exports.options = new builders_1.SlashCommandBuilder()
    .setName("volume")
    .setDescription("Установить громкость плеера.")
    .addIntegerOption((o) => o.setName("volume").setDescription("Новая громкость плеера.").setRequired(true).setMinValue(1).setMaxValue(200))
    .toJSON();
exports.permission = 0;
async function run(interaction) {
    if (!(interaction.member instanceof discord_js_1.GuildMember))
        return;
    const client = interaction.client;
    const gdb = await database_1.default.guild(interaction.guild.id);
    if (gdb.get().channel == interaction.channelId)
        return interaction.reply({ content: "❌ Эта команда недоступна в данном канале.", ephemeral: true });
    if (!interaction.member.voice.channel)
        return interaction.reply({ content: "❌ Вы должны находится в голосовом канале.", ephemeral: true });
    if (interaction.guild.me.voice.channel &&
        interaction.member.voice.channel.id != interaction.guild.me.voice.channel.id)
        return interaction.reply({ content: "❌ Вы должны находится в том же голосовом канале, что и я.", ephemeral: true });
    const player = client.manager.get(interaction.guildId);
    if (!player) {
        return await interaction.reply({
            content: "❌ На этом сервере ничего не играет.",
            ephemeral: true
        });
    }
    ;
    await interaction.reply(`Новая громкость - \`${interaction.options.getInteger("volume")}%\``)
        .then(() => player.setVolume(interaction.options.getInteger("volume")));
}
exports.run = run;
;
