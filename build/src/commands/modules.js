"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const discord_js_1 = require("discord.js");
exports.options = new discord_js_1.SlashCommandBuilder()
    .setName("modules")
    .setDescription("Настроить модули счёта.")
    .toJSON();
exports.permission = 2;
const discord_js_2 = require("discord.js");
const modules_1 = require("../constants/modules");
const Util_1 = __importDefault(require("../util/Util"));
const names = {
    "allow-spam": "Allow spam",
    "embed": "Embed",
    "talking": "Talking",
    "webhook": "Webhook"
};
const run = async (interaction) => {
    const gdb = await Util_1.default.database.guild(interaction.guild.id);
    const { modules: oldModules } = gdb.get();
    const m = await interaction.reply({
        fetchReply: true,
        components: [
            new discord_js_2.ActionRowBuilder().setComponents([
                new discord_js_2.SelectMenuBuilder()
                    .setPlaceholder("Выберите модули")
                    .setCustomId("modules_menu")
                    .setMinValues(0)
                    .setMaxValues(4)
                    .setOptions(Object.keys(modules_1.modules).map((module) => ({
                    label: names[module],
                    value: module,
                    description: modules_1.modules[module].short,
                    default: oldModules.includes(module)
                })))
            ])
        ]
    });
    const collector = m.createMessageComponentCollector({
        filter: (i) => i.customId == "modules_menu" && i.user.id == interaction.user.id,
        componentType: discord_js_2.ComponentType.SelectMenu,
        time: 60 * 1000,
        idle: 30 * 1000
    });
    collector.on("collect", () => collector.stop("abc"));
    collector.on("end", async (a, r) => {
        if ("abc" != r)
            await interaction.editReply({
                content: "Время вышло.",
                components: [
                    new discord_js_2.ActionRowBuilder().setComponents([
                        new discord_js_2.ButtonBuilder().setCustomId("reply:delete").setStyle(discord_js_2.ButtonStyle.Danger).setEmoji("🗑")
                    ])
                ]
            });
        else {
            const newModules = a.first()?.values;
            if (newModules.includes("embed") && newModules.includes("webhook")) {
                await a.first().update({
                    content: "Модули **Embed** и **Webhook** несовместимы.",
                    components: [
                        new discord_js_2.ActionRowBuilder().setComponents([
                            new discord_js_2.ButtonBuilder().setCustomId("reply:delete").setStyle(discord_js_2.ButtonStyle.Danger).setEmoji("🗑")
                        ])
                    ]
                });
                return;
            }
            ;
            const oldList = oldModules?.map((m) => names[m]).join("**, **") || "Пусто";
            const newList = newModules?.map((m) => names[m]).join("**, **") || "Пусто";
            gdb.set("modules", newModules);
            await a.first().update({
                content: [
                    "​> **Изменения:**",
                    `Прошлые модули: **${oldList}**`,
                    `Новые модули: **${newList}**`
                ].join("\n"),
                components: [
                    new discord_js_2.ActionRowBuilder().setComponents([
                        new discord_js_2.ButtonBuilder().setCustomId("reply:delete").setStyle(discord_js_2.ButtonStyle.Danger).setEmoji("🗑")
                    ])
                ]
            });
        }
        ;
    });
};
exports.run = run;
