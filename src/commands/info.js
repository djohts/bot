module.exports = {
    name: "info",
    description: "Посмотреть информацию о боте.",
    permissionRequired: 0,
    slash: true
};

const { CommandInteraction } = require("discord.js");

const os = require("os");
const platform = `${os.type()} (${os.release()})`;
const djsversion = require("../../package.json").dependencies["discord.js"];
const config = require("../../config");

let guilds = 0, users = 0, shardCount = 0, memory = 0, memoryUsage = "0MB", memoryGlobal = 0, memoryUsageGlobal = "0MB", nextUpdate = Date.now();

module.exports.run = async (interaction = new CommandInteraction) => {
    if (nextUpdate < Date.now()) {
        nextUpdate = Date.now() + 10000;
        if (interaction.client.shard) {
            guilds = await interaction.client.shard.broadcastEval(bot => bot.guilds.cache.size).then(res => res.reduce((prev, val) => prev + val, 0));
            users = await interaction.client.shard.broadcastEval(bot => bot.guilds.cache.map(g => g.memberCount).reduce((a, b) => a + b)).then(res => res.reduce((prev, val) => prev + val, 0));
            shardCount = interaction.client.shard.count;
        } else {
            guilds = interaction.client.guilds.cache.size;
            users = interaction.client.users.cache.size;
            shardCount = 0;
        };

        const { heapUsed, rss } = process.memoryUsage();

        memory = heapUsed / (1048576); // 1024 * 1024
        if (memory >= 1024) memoryUsage = (memory / 1024).toFixed(2) + "GB";
        else memoryUsage = memory.toFixed(2) + "MB";

        memoryGlobal = rss / (1048576); // 1024 * 1024
        if (memoryGlobal >= 1024) memoryUsageGlobal = (memoryGlobal / 1024).toFixed(2) + "GB";
        else memoryUsageGlobal = memoryGlobal.toFixed(2) + "MB";
    };

    return await interaction.reply({
        embed: {
            title: `Информация о ${interaction.client.user.tag}`,
            timestamp: Date.now(),
            fields: [
                {
                    name: "💠 Хост",
                    value: [
                        `**ОС**: \`${platform}\``,
                        `**Библиотека**: \`discord.js${djsversion}\``,
                        `**Исп. ОЗУ**: \`${interaction.client.shard ? memoryUsageGlobal : memoryUsage}\``
                    ].join("\n"),
                    inline: true
                },
                {
                    name: "🌀 Статистика",
                    value: [
                        `**Кол-во серверов**: \`${guilds}\``,
                        `**Кол-во юзеров**: \`${users}\``,
                        `**Кол-во шардов**: \`${shardCount}\``
                    ].join("\n"),
                    inline: true
                },
                {
                    name: interaction.client.shard ? `🔷 Этот шард (${interaction.guild.shardId})` : false,
                    value: [
                        `**Кол-во серверов**: \`${interaction.client.guilds.cache.size}\``,
                        `**Кол-во юзеров**: \`${interaction.client.guilds.cache.map(g => g.memberCount).reduce((a, b) => a + b)}\``,
                        `**Исп. ОЗУ**: \`${memoryUsage}\``
                    ].join("\n"),
                    inline: true
                },
                {
                    name: "🌐 Ссылки",
                    value: [
                        `**Пригласи меня:** [тык](${await interaction.client.generateInvite({ permissions: 281673 })})`,
                        "**Сервер поддержки**: [📥 Вступить](https://discord.gg/AaS4dwVHyA)"
                    ].join("\n"),
                    inline: false
                }
            ].filter(f => f.name) // filters out shard field if sharding is disabled
        }
    });
};