"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("stop")
    .setDescription("Остановить плеер.")
    .toJSON();
exports.permission = 0;
const Util_1 = __importDefault(require("../util/Util"));
const run = async (interaction) => {
    const member = interaction.member;
    if (!member.voice.channel)
        return await interaction.reply({ content: "❌ Вы должны находится в голосовом канале.", ephemeral: true });
    if (interaction.guild.me.voice.channel &&
        member.voice.channel.id !== interaction.guild.me.voice.channel.id)
        return await interaction.reply({ content: "❌ Вы должны находится в том же голосовом канале, что и я.", ephemeral: true });
    const player = Util_1.default.lava.get(interaction.guildId);
    if (!player) {
        return await interaction.reply({ content: "❌ На этом сервере ничего не играет.", ephemeral: true });
    }
    ;
    await interaction.reply("Плеер был остановлен.").then(() => player.destroy());
    setTimeout(async () => await interaction.deleteReply().catch(() => { }), 30 * 1000);
};
exports.run = run;
