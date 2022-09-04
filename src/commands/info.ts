import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("info")
    .setDescription("Посмотреть информацию о боте.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import { Client } from "discord-hybrid-sharding";
import { version } from "discord.js";
import Util from "../util/Util.js";
import prettyms from "pretty-ms";
import os from "os";
const platform = `${os.type()} (${os.release()})`;
let guilds = 0, users = 0, clusterCount = 0, shardCount = 0, memoryUsage = 0, memoryUsageGlobal = 0, nextUpdate = 0;

export const run = async (interaction: ChatInputCommandInteraction) => {
    if (nextUpdate < Date.now()) {
        nextUpdate = Date.now() + 10 * 1000;

        guilds = await interaction.client.cluster.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((prev, val) => prev + val, 0));
        users = await interaction.client.cluster.broadcastEval((bot) =>
            bot.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b)
        ).then((res) => res.reduce((prev, val) => prev + val, 0));

        clusterCount = Client.getInfo().CLUSTER_COUNT;
        shardCount = Client.getInfo().TOTAL_SHARDS;

        const { rss, heapUsed } = process.memoryUsage();

        memoryUsageGlobal = rss;
        memoryUsage = heapUsed;
    };

    const clusterGuilds = interaction.client.guilds.cache.size;
    const clusterUsers = interaction.client.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b, 0);

    const shardId = interaction.guild.shard.id;
    const shardGuilds = interaction.client.guilds.cache.filter((g) => g.shard.id === shardId).size;
    const shardUsers = interaction.client.guilds.cache.filter((g) => g.shard.id === shardId).map((g) => g.memberCount).reduce((prev, val) => prev + val, 0);

    return interaction.reply({
        embeds: [{
            title: `Информация о ${interaction.client.user.tag}`,
            fields: [{
                name: "💠 Хост",
                value: [
                    `**ОС**: \`${platform}\``,
                    `**Библиотека**: \`discord.js v${version}\``,
                    `**Кол-во кластеров**: \`${clusterCount.toLocaleString()}\``,
                    `**Кол-во шардов**: \`${shardCount.toLocaleString()}\``,
                    `**Исп. ОЗУ**: \`${Util.prettyBytes(memoryUsageGlobal, 2)}\``
                ].join("\n"),
                inline: true
            }, {
                name: `🔷 Этот кластер (${interaction.client.cluster.id.toLocaleString()})`,
                value: [
                    `**Кол-во серверов**: \`${clusterGuilds.toLocaleString()}\``,
                    `**Кол-во юзеров**: \`${clusterUsers.toLocaleString()}\``,
                    `**Кол-во шардов**: \`${interaction.client.cluster.ids.size.toLocaleString()}\``,
                    `**Исп. ОЗУ**: \`${Util.prettyBytes(memoryUsage, 2)}\``,
                    `**Аптайм**: \`${prettyms(interaction.client.uptime)}\``
                ].join("\n"),
                inline: true
            }, {
                name: `🌀 Этот шард (${shardId.toLocaleString()})`,
                value: [
                    `**Кол-во серверов**: \`${shardGuilds.toLocaleString()}\``,
                    `**Кол-во юзеров**: \`${shardUsers.toLocaleString()}\``,
                    `**Задержка сокета**: \`${interaction.guild.shard.ping.toLocaleString()}ms\``
                ].join("\n"),
                inline: true
            }, {
                name: "🌐 Ссылки",
                value: [
                    `[📥 Пригласить бота](${[
                        "https://discord.com/oauth2/authorize",
                        `?client_id=${interaction.client.user.id}`,
                        "&scope=bot%20applications.commands",
                        "&permissions=1375450033182"
                    ].join("")})`,
                    "[📡 Сервер поддержки](https://discord.gg/AaS4dwVHyA)",
                    "[📰 Сайт бота](https://dob.djoh.xyz)"
                ].join("\n"),
                inline: true
            }, {
                name: "📈 Статистика",
                value: [
                    `**Кол-во серверов**: \`${guilds.toLocaleString()}\``,
                    `**Кол-во юзеров**: \`${users.toLocaleString()}\``
                ].join("\n"),
                inline: true
            }]
        }]
    });
};