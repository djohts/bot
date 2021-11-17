module.exports = {
    name: "info",
    description: "Посмотреть информацию о боте.",
    permissionRequired: 0,
    slash: true
};

const { CommandInteraction } = require("discord.js");

const os = require("os");
const platform = `${os.type()} (${os.release()})`;
const { version } = require("discord.js");

let guilds = 0, users = 0, shardCount = 0, memory = 0, memoryUsage = "0MB", memoryGlobal = 0, memoryUsageGlobal = "0MB", nextUpdate = Date.now();

module.exports.run = async (interaction = new CommandInteraction) => {
    const botId = interaction.client.user.id;
    if (nextUpdate < Date.now()) {
        nextUpdate = Date.now() + 5000;

        guilds = await interaction.client.shard.broadcastEval(bot => bot.guilds.cache.size).then(res => res.reduce((prev, val) => prev + val, 0));
        users = await interaction.client.shard.broadcastEval(bot => bot.guilds.cache.map(g => g.memberCount).reduce((a, b) => a + b)).then(res => res.reduce((prev, val) => prev + val, 0));
        shardCount = interaction.client.shard.count;

        const { rss, heapUsed } = process.memoryUsage();

        memoryGlobal = rss / (1048576); // 1024 * 1024
        if (memoryGlobal >= 1024) memoryUsageGlobal = (memoryGlobal / 1024).toFixed(2) + "GB";
        else memoryUsageGlobal = memoryGlobal.toFixed(2) + "MB";
        memory = heapUsed / (1048576); // 1024 * 1024
        if (memory >= 1024) memoryUsage = (memory / 1024).toFixed(2) + "GB";
        else memoryUsage = memory.toFixed(2) + "MB";
    };

    return await interaction.reply({
        embeds: [{
            title: `Информация о ${interaction.client.user.tag}`,
            timestamp: Date.now(),
            fields: [
                {
                    name: "💠 Хост",
                    value: [
                        `**ОС**: \`${platform}\``,
                        `**Библиотека**: \`discord.js v${version}\``,
                        `**Исп. ОЗУ**: \`${memoryUsageGlobal}\``
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
                    name: `🔷 Этот шард (${interaction.guild.shardId})`,
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
                        `[📥 Пригласить бота](https://discord.com/oauth2/authorize?client_id=${botId}&scope=bot%20applications.commands&permissions=1007021151)`,
                        "[📥 Сервер поддержки](https://discord.gg/AaS4dwVHyA)"
                    ].join("\n"),
                    inline: false
                }
            ]
        }]
    });
};