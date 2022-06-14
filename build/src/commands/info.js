"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("info")
    .setDescription("Посмотреть информацию о боте.")
    .toJSON();
exports.permission = 0;
const os_1 = __importDefault(require("os"));
const platform = `${os_1.default.type()} (${os_1.default.release()})`;
const Util_js_1 = __importDefault(require("../util/Util.js"));
const discord_js_1 = require("discord.js");
let guilds = 0, users = 0, shardCount = 0, memoryUsage = "0MB", memoryUsageGlobal = "0MB", nextUpdate = Date.now();
const run = async (interaction) => {
    if (nextUpdate < Date.now()) {
        nextUpdate = Date.now() + 10 * 1000;
        guilds = await interaction.client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((prev, val) => prev + val, 0));
        users = await interaction.client.shard.broadcastEval((bot) => bot.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b)).then((res) => res.reduce((prev, val) => prev + val, 0));
        shardCount = interaction.client.shard.count;
        const { rss, heapUsed } = process.memoryUsage();
        memoryUsageGlobal = Util_js_1.default.prettyBytes(rss, { maximumFractionDigits: 2 });
        memoryUsage = Util_js_1.default.prettyBytes(heapUsed, { maximumFractionDigits: 2 });
    }
    ;
    await interaction.reply({
        embeds: [{
                title: `Информация о ${interaction.client.user.tag}`,
                fields: [{
                        name: "💠 Хост",
                        value: [
                            `**ОС**: \`${platform}\``,
                            `**Библиотека**: \`discord.js v${discord_js_1.version}\``,
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
                                "&permissions=1375450033182"
                            ].join("")})`,
                            "[📡 Сервер поддержки](https://discord.gg/AaS4dwVHyA)",
                            "[📰 Сайт бота](https://dob.djoh.xyz)"
                        ].join("\n")
                    }]
            }]
    });
};
exports.run = run;
