"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
const database_1 = __importDefault(require("../database/"));
exports.options = new builders_1.SlashCommandBuilder()
    .setName("settings")
    .setDescription("Настройки бота на сервере.")
    .addSubcommand((c) => c.setName("get").setDescription("Получить настройки сервера."))
    .addSubcommand((c) => c.setName("toggle").setDescription("Изменить значение найстройки.").addStringOption((o) => o.setName("setting").setDescription("Настройка, которую надо изменить.").setRequired(true).setChoices([
    ["Удаление сообщений замьюченых участников.", "delMuted"],
    ["Удаление закреплённых сообщений при очистке (/purge).", "purgePinned"],
    ["Временные голосовые каналы.", "voices"],
    ["Проверка сообщений на вредоносные ссылки.", "detectScamLinks"]
])))
    .addSubcommand((c) => c.setName("muterole").setDescription("Установить роль мьюта.").addRoleOption((o) => o.setName("role").setDescription("Роль.").setRequired(true)))
    .addSubcommand((c) => c.setName("setlobby").setDescription("Установить лобби для голосовых каналов.").addChannelOption((o) => o.setName("channel").setDescription("Канал-генератор, в который надо зайти для создания временного канала.").setRequired(true).addChannelType(2)))
    .addSubcommand((c) => c.setName("counting").setDescription("Настройки модуля счёта.").addChannelOption((o) => o.setName("channel").setDescription("Текстовый канал в котором пользователи смогут считать циферки.").setRequired(true).addChannelType(0)))
    .toJSON();
exports.permission = 2;
const run = async (interaction) => {
    const cmd = interaction.options.getSubcommand();
    const gset = await database_1.default.settings(interaction.guild.id);
    const gdb = await database_1.default.guild(interaction.guild.id);
    if (cmd == "get") {
        await interaction.reply({
            embeds: [{
                    title: "Настройки " + interaction.guild.name,
                    timestamp: Date.now(),
                    fields: [{
                            name: "Удаление закреплённых сообщений",
                            value: gset.get().purgePinned ?
                                "<:online:887393623845507082> **`Включено`**" :
                                "<:dnd:887393623786803270> **`Выключено`**",
                            inline: true
                        }, {
                            name: "Удаление сообщений замьюченых участников",
                            value: gset.get().delMuted ?
                                "<:online:887393623845507082> **`Включено`**" :
                                "<:dnd:887393623786803270> **`Выключено`**",
                            inline: true
                        }, {
                            name: "Роль мьюта",
                            value: gset.get().muteRole ? `<@&${gset.get().muteRole}>` : "**`Не установлена`**"
                        }, {
                            name: "Временные голосовые каналы",
                            value: gset.get().voices.enabled ?
                                "<:online:887393623845507082> **`Включены`**" :
                                "<:dnd:887393623786803270> **`Выключены`**",
                            inline: true
                        }, {
                            name: "Лобби-канал",
                            value: gset.get().voices.lobby ?
                                `<#${gset.get().voices.lobby}>` :
                                "**`Не установлен`**",
                            inline: true
                        }, {
                            name: "Проверка сообщений на вредоносные ссылки.",
                            value: gset.get().detectScamLinks ?
                                "<:online:887393623845507082> **`Включено`**" :
                                "<:dnd:887393623786803270> **`Выключено`**",
                            inline: true
                        }]
                }]
        });
    }
    else if (cmd == "toggle") {
        let idk = "";
        const type = interaction.options.getString("setting");
        if (type == "delMuted") {
            gset.get().delMuted ? (() => {
                gset.set("delMuted", false);
                idk = "**`Удаление сообщений замьюченых участников`** было выключено.";
            })() : (() => {
                gset.set("delMuted", true);
                idk = "**`Удаление сообщений замьюченых участников`** было включено.";
            })();
            await interaction.reply({ content: idk });
        }
        else if (type == "purgePinned") {
            gset.get().purgePinned ? (() => {
                gset.set("purgePinned", false);
                idk = "**`Удаление закреплённых сообщений`** было выключено.";
            })() : (() => {
                gset.set("purgePinned", true);
                idk = "**`Удаление закреплённых сообщений`** было включено.";
            })();
            await interaction.reply({ content: idk });
        }
        else if (type == "voices") {
            gset.get().voices.enabled ? (() => {
                gset.setOnObject("voices", "enabled", false);
                idk = "**`Временные голосовые каналы`** были выключены.";
            })() : (() => {
                gset.setOnObject("voices", "enabled", true);
                idk = "**`Временные голосовые каналы`** были включены.";
            })();
            await interaction.reply({ content: idk });
        }
        else if (type == "detectScamLinks") {
            gset.get().detectScamLinks ? (() => {
                gset.set("detectScamLinks", false);
                idk = "**`Проверка сообщений на вредоносные ссылки`** была выключена.";
            })() : (() => {
                gset.set("detectScamLinks", true);
                idk = "**`Проверка сообщений на вредоносные ссылки`** была включена.";
            })();
            await interaction.reply({ content: idk });
        }
        ;
        ;
    }
    else if (cmd == "muterole") {
        const role = interaction.options.getRole("role");
        gset.set("muteRole", role.id);
        await interaction.reply({
            content: "✅ Роль мьюта была установлена." + (interaction.guild.me.roles.highest.rawPosition <= role.rawPosition
                ? "\n⚠️ Установленная роль находится выше моей. Имейте ввиду, что команда мьюта при таком условии **работать не будет**"
                : "")
        });
    }
    else if (cmd == "setlobby") {
        let lobby = interaction.options.getChannel("channel");
        gset.setOnObject("voices", "lobby", lobby.id);
        await interaction.reply({ content: `✅ Лобби было установлено. (${lobby})` });
    }
    else if (cmd == "setchannel") {
        let counting = interaction.options.getChannel("channel");
        gdb.setMultiple({
            channel: counting.id,
            count: 0,
            user: "",
            message: `${parseInt(interaction.id) + 1}`
        });
        await interaction.reply({ content: `✅ Канал счёта был установлен. (${counting})` });
    }
    ;
};
exports.run = run;
