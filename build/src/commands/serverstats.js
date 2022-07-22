"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const discord_js_1 = require("discord.js");
const v9_1 = require("discord-api-types/v9");
exports.options = new discord_js_1.SlashCommandBuilder()
    .setName("serverstats")
    .setDescription("Управлять каналами статистики.")
    .addSubcommand(c => c
    .setName("set")
    .setDescription("Установить канал статистики.")
    .addChannelOption(o => o
    .setName("channel")
    .setDescription("Канал.")
    .addChannelTypes(v9_1.ChannelType.GuildCategory, v9_1.ChannelType.GuildText, v9_1.ChannelType.GuildVoice, v9_1.ChannelType.GuildNews, v9_1.ChannelType.GuildStageVoice)
    .setRequired(true))
    .addStringOption(o => o
    .setName("text")
    .setDescription("Шаблонизатор. Ссылка на гайд в команде /docs")
    .setRequired(true)))
    .addSubcommand(c => c
    .setName("delete")
    .setDescription("Удалить канал статистики.")
    .addStringOption(o => o
    .setName("channel")
    .setDescription("Айди канала. Доступно автозаполнение.")
    .setAutocomplete(true)
    .setRequired(true)))
    .addSubcommand(c => c
    .setName("list")
    .setDescription("Список каналов статистики."))
    .toJSON();
exports.permission = 3;
const Util_1 = __importDefault(require("../util/Util"));
const run = async (interaction) => {
    const gdb = await Util_1.default.database.guild(interaction.guild.id);
    switch (interaction.options.getSubcommand()) {
        case "set":
            const channel = interaction.options.getChannel("channel");
            const text = interaction.options.getString("text");
            if (Object.keys(gdb.get().statschannels).length === 5)
                return await interaction.reply("Вы не можете установить больше 5 каналов статистики.");
            if (text.length > 64)
                return await interaction.reply("Длина шаблона должна быть не длиннее 64 символов.");
            gdb.setOnObject("statschannels", channel.id, text);
            await interaction.reply([
                `Канал статистики установлен: ${channel}`,
                `Шаблон: \`${text.replace(/\`/g, "")}\``
            ].join("\n"));
            break;
        case "delete":
            const channelId = interaction.options.getString("channel");
            gdb.removeFromObject("statschannels", channelId);
            await interaction.reply(`Канал статистики удален: <#${channelId}>`);
            break;
        case "list":
            const { statschannels } = gdb.get();
            const result = [];
            for (const [channelId, text] of Object.entries(statschannels)) {
                result.push([
                    `> <#${channelId}> (\`${channelId}\`)`,
                    `\`${text.replace(/\`/g, "")}\``
                ].join("\n"));
            }
            ;
            await interaction.reply({
                embeds: [{
                        title: "Каналы статистики",
                        description: result.join("\n\n") || "Тут пусто."
                    }]
            });
            break;
    }
    ;
};
exports.run = run;
