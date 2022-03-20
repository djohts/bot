import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("info")
    .setDescription("Посмотреть информацию о боте.")
    .toJSON();
export const permission = 0;

import { CommandInteraction } from "discord.js";

import os from "os";
const platform = `${os.type()} (${os.release()})`;
import { version } from "discord.js";

let guilds = 0, users = 0, shardCount = 0, memory = 0, memoryUsage = "0MB", memoryGlobal = 0, memoryUsageGlobal = "0MB", nextUpdate = Date.now();

export async function run(interaction: CommandInteraction) {
    if (nextUpdate < Date.now()) {
        nextUpdate = Date.now() + 10 * 1000;

        guilds = await interaction.client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((prev, val) => prev + val, 0));
        users = await interaction.client.shard.broadcastEval((bot) =>
            bot.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b)
        ).then((res) => res.reduce((prev, val) => prev + val, 0));
        shardCount = interaction.client.shard.count;

        const { rss, heapUsed } = process.memoryUsage();

        memoryGlobal = rss / 1024 / 1024;
        if (memoryGlobal >= 1024) memoryUsageGlobal = (memoryGlobal / 1024).toFixed(2) + "GB";
        else memoryUsageGlobal = memoryGlobal.toFixed(2) + "MB";
        memory = heapUsed / 1024 / 1024;
        if (memory >= 1024) memoryUsage = (memory / 1024).toFixed(2) + "GB";
        else memoryUsage = memory.toFixed(2) + "MB";
    };

    await interaction.reply({
        embeds: [{
            title: `Информация о ${interaction.client.user.tag}`,
            fields: [{
                name: "💠 Хост",
                value: [
                    `**ОС**: \`${platform}\``,
                    `**Библиотека**: \`discord.js v${version}\``,
                    `**Исп. ОЗУ**: \`${memoryUsageGlobal}\``
                ].join("\n"),
                inline: true
            }, {
                name: "🌀 Статистика",
                value: [
                    `**Кол-во серверов**: \`${guilds}\``,
                    `**Кол-во юзеров**: \`${users}\``,
                    `**Кол-во шардов**: \`${shardCount}\``
                ].join("\n"),
                inline: true
            }, {
                name: `🔷 Этот шард (${interaction.guild.shard.id})`,
                value: [
                    `**Кол-во серверов**: \`${interaction.client.guilds.cache.size}\``,
                    `**Кол-во юзеров**: \`${interaction.client.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b)}\``,
                    `**Исп. ОЗУ**: \`${memoryUsage}\``
                ].join("\n"),
                inline: true
            }, {
                name: "🌐 Ссылки",
                value: [
                    `[📥 Пригласить бота](${[
                        "https://discord.com/oauth2/authorize",
                        `?client_id=${interaction.client.user.id}`,
                        "&scope=bot%20applications.commands",
                        "&permissions=550614986206"
                    ].join("")})`,
                    "[📡 Сервер поддержки](https://discord.gg/AaS4dwVHyA)"
                ].join("\n")
            }]
        }]
    });
};