"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("modules")
    .setDescription("Настроить модули счёта.")
    .toJSON();
exports.permission = 2;
const database_1 = __importDefault(require("../database/"));
const discord_js_1 = require("discord.js");
const modules_1 = require("../constants/modules");
const names = {
    "allow-spam": "Allow spam",
    "embed": "Embed",
    "talking": "Talking",
    "webhook": "Webhook"
};
async function run(interaction) {
    const gdb = await database_1.default.guild(interaction.guild.id);
    const { modules: oldModules } = gdb.get();
    const m = await interaction.reply({
        content: "​",
        fetchReply: true,
        /*components: [{
            type: 1,
            components: [{
                placeholder: "Выберите модули",
                type: 3,
                custom_id: "modules_menu",
                min_values: 0,
                max_values: 4,
                options: Object.keys(allModules).map((module) => ({
                    label: names[module],
                    value: module,
                    description: allModules[module].short,
                    default: oldModules.includes(module)
                }))
            }]
        }]*/
        components: [
            new discord_js_1.MessageActionRow().setComponents([
                new discord_js_1.MessageSelectMenu()
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
        ],
        ephemeral: (gdb.get().channel == interaction.channel.id)
    });
    const collector = m.createMessageComponentCollector({
        filter: (i) => i.customId == "modules_menu" && i.user.id == interaction.user.id,
        componentType: "SELECT_MENU",
        time: 60 * 1000,
        idle: 30 * 1000
    });
    collector.on("collect", () => collector.stop("abc"));
    collector.on("end", async (a, r) => {
        if ("abc" != r)
            await interaction.editReply({
                content: "Время вышло.",
                components: [
                    new discord_js_1.MessageActionRow().setComponents([
                        new discord_js_1.MessageButton()
                            .setCustomId("reply:delete")
                            .setStyle("DANGER")
                            .setEmoji("🗑")
                    ])
                ]
            });
        else {
            const newModules = a.first()?.values;
            if (newModules.includes("embed") && newModules.includes("webhook"))
                return await a.first().update({
                    content: "Модули **Embed** и **Webhook** несовместимы.",
                    components: [
                        new discord_js_1.MessageActionRow().setComponents([
                            new discord_js_1.MessageButton()
                                .setCustomId("reply:delete")
                                .setStyle("DANGER")
                                .setEmoji("🗑")
                        ])
                    ]
                });
            const oldList = oldModules?.map((m) => names[m]).join("**, **") || "Пусто";
            const newList = newModules?.map((m) => names[m]).join("**, **") || "Пусто";
            gdb.set("modules", newModules);
            await a.first().update({
                content: [
                    "​- **Изменения:**",
                    `Прошлые модули: **${oldList}**`,
                    `Новые модули: **${newList}**`
                ].join("\n"),
                components: [
                    new discord_js_1.MessageActionRow().setComponents([
                        new discord_js_1.MessageButton()
                            .setCustomId("reply:delete")
                            .setStyle("DANGER")
                            .setEmoji("🗑")
                    ])
                ]
            });
        }
        ;
    });
}
exports.run = run;
;
