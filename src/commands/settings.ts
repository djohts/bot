import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Настройки бота на сервере.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addSubcommand((c) => c.setName("get").setDescription("Получить настройки сервера."))
    .addSubcommand((c) => c.setName("toggle").setDescription("Изменить значение найстройки.").addStringOption((o) =>
        o.setName("setting").setDescription("Настройка, которую надо изменить.").setRequired(true)
            .setChoices({
                name: "Удаление закреплённых сообщений при очистке (/purge).", value: "purgePinned"
            }, {
                name: "Временные голосовые каналы.", value: "voices"
            })
    ))
    .addSubcommand((c) => c.setName("setlobby").setDescription("Установить лобби для голосовых каналов.").addChannelOption((o) =>
        o.setName("channel").setDescription("Канал-генератор, в который надо зайти для создания временного канала.").setRequired(true).addChannelTypes(2)
    ))
    .addSubcommand((c) => c.setName("counting").setDescription("Настройки модуля счёта.").addChannelOption((o) =>
        o.setName("channel").setDescription("Текстовый канал в котором пользователи смогут считать циферки.").setRequired(true).addChannelTypes(0)
    ))
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const cmd = interaction.options.getSubcommand();
    const gset = await Util.database.settings(interaction.guild.id);
    const gdb = await Util.database.guild(interaction.guild.id);

    if (cmd === "get") {
        return interaction.reply({
            embeds: [{
                title: "Настройки " + interaction.guild.name,
                fields: [{
                    name: "Удаление закреплённых сообщений",
                    value: gset.get().purgePinned ?
                        "🟢 **`Включено`**" :
                        "🔴 **`Выключено`**",
                    inline: true
                }, {
                    name: "Временные голосовые каналы",
                    value: gset.get().voices.enabled ?
                        "🟢 **`Включены`**" :
                        "🔴 **`Выключены`**",
                    inline: true
                }, {
                    name: "Лобби-канал",
                    value: gset.get().voices.lobby ?
                        `<#${gset.get().voices.lobby}>` :
                        "**`Не установлен`**",
                    inline: true
                }]
            }]
        });
    } else if (cmd === "toggle") {
        const type = interaction.options.getString("setting");
        let idk = "";

        if (type === "purgePinned") {
            gset.get().purgePinned ? (() => {
                gset.set("purgePinned", false);
                idk = "**`Удаление закреплённых сообщений`** было выключено.";
            })() : (() => {
                gset.set("purgePinned", true);
                idk = "**`Удаление закреплённых сообщений`** было включено.";
            })();
        } else if (type === "voices") {
            gset.get().voices.enabled ? (() => {
                gset.setOnObject("voices", "enabled", false);
                idk = "**`Временные голосовые каналы`** были выключены.";
            })() : (() => {
                gset.setOnObject("voices", "enabled", true);
                idk = "**`Временные голосовые каналы`** были включены.";
            })();
        };
        return interaction.reply(idk);
    } else if (cmd === "setlobby") {
        const lobby = interaction.options.getChannel("channel");
        gset.setOnObject("voices", "lobby", lobby.id);
        return interaction.reply(`✅ Лобби было установлено. (${lobby})`);
    } else if (cmd === "counting") {
        const channel = interaction.options.getChannel("channel");
        gdb.setMultiple({
            channel: channel.id,
            count: 0,
            user: "",
            message: interaction.id
        });
        return interaction.reply(`✅ Канал счёта был установлен. (${channel})`);
    };
};