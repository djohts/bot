import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types/v9";

export const options = new SlashCommandBuilder()
    .setName("serverstats")
    .setDescription("Управлять каналами статистики.")
    .addSubcommand(c =>
        c
            .setName("set")
            .setDescription("Установить канал статистики.")
            .addChannelOption(o =>
                o
                    .setName("channel")
                    .setDescription("Канал.")
                    .addChannelTypes(
                        ChannelType.GuildCategory, ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildNews, ChannelType.GuildStageVoice
                    )
                    .setRequired(true)
            )
            .addStringOption(o =>
                o
                    .setName("text")
                    .setDescription("Шаблонизатор. Ссылка на гайд в команде /docs")
                    .setRequired(true)
            )
    )
    .addSubcommand(c =>
        c
            .setName("delete")
            .setDescription("Удалить канал статистики.")
            .addStringOption(o =>
                o
                    .setName("channel")
                    .setDescription("Айди канала. Доступно автозаполнение.")
                    .setAutocomplete(true)
                    .setRequired(true)
            )
    )
    .addSubcommand(c =>
        c
            .setName("list")
            .setDescription("Список каналов статистики.")
    )
    .toJSON();
export const permission = 3;

import { CommandInteraction } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: CommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guild.id);

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
            const result: string[] = [];

            for (const [channelId, text] of Object.entries(statschannels)) {
                result.push([
                    `> <#${channelId}> (\`${channelId}\`)`,
                    `\`${text.replace(/\`/g, "")}\``
                ].join("\n"));
            };

            await interaction.reply({
                embeds: [{
                    title: "Каналы статистики",
                    description: result.join("\n\n") || "Тут пусто."
                }]
            });
            break;
    };
};