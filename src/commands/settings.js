module.exports = {
    name: "settings",
    permissionRequired: 2,
    opts: [{
        name: "get",
        description: "Получить настройки сервера.",
        type: 1
    },
    {
        name: "toggle",
        description: "Изменить значение найстройки.",
        type: 1,
        options: [{
            name: "setting",
            description: "Настройка, которую надо изменить.",
            type: 3,
            required: true,
            choices: [
                {
                    name: "Удаление сообщений замьюченых участников.",
                    value: "delMuted"
                },
                {
                    name: "Удаление закреплённых сообщений при очистке (/purge).",
                    value: "purgePinned"
                },
                {
                    name: "Временные голосовые каналы.",
                    value: "voices"
                }
            ]
        }]
    },
    {
        name: "muterole",
        description: "Установить роль мьюта.",
        type: 1,
        options: [{
            name: "role",
            description: "Роль.",
            type: 8,
            required: true
        }]
    },
    {
        name: "voice",
        description: "Настройки модуля временных голосовых каналов.",
        type: 2,
        options: [{
            name: "setlobby",
            description: "Установить лобби для голосовых каналов.",
            type: 1,
            options: [{
                name: "channel",
                description: "Канал-генератор, в который надо зайти для создания временного канала.",
                type: 7,
                channel_types: [2],
                required: true
            }]
        }]
    },
    {
        name: "counting",
        description: "Настройки модуля счёта.",
        type: 2,
        options: [{
            name: "setchannel",
            description: "Установить канал для счёта.",
            type: 1,
            options: [{
                name: "channel",
                description: "Текстовый канал в котором пользователи смогут считать циферки.",
                type: 7,
                channel_types: [0],
                required: true
            }]
        }]
    }],
    slash: true
};

const { CommandInteraction } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction) => {
    if (!(interaction instanceof CommandInteraction)) return;

    const cmd = interaction.options.getSubcommand();
    const gset = await db.settings(interaction.guild.id);
    const gdb = await db.guild(interaction.guild.id);

    if (cmd == "get") {
        return await interaction.reply({
            embeds: [{
                title: "Настройки " + interaction.guild.name,
                timestamp: Date.now(),
                fields: [
                    {
                        name: "Удаление сообщений замьюченых участников",
                        value: gset.get().delMuted ?
                            "<:online:887393623845507082> **`Включено`**" :
                            "<:dnd:887393623786803270> **`Выключено`**",
                        inline: true
                    },
                    {
                        name: "Удаление закреплённых сообщений",
                        value: gset.get().purgePinned ?
                            "<:online:887393623845507082> **`Включено`**" :
                            "<:dnd:887393623786803270> **`Выключено`**",
                        inline: true
                    },
                    {
                        name: "Роль мьюта",
                        value: gset.get().muteRole ? `<@&${gset.get().muteRole}>` : "**`Не установлена`**"
                    },
                    {
                        name: "Временные голосовые каналы",
                        value: gset.get().voices.enabled ?
                            "<:online:887393623845507082> **`Включены`**" :
                            "<:dnd:887393623786803270> **`Выключены`**",
                        inline: true
                    },
                    {
                        name: "Лобби-канал",
                        value: gset.get().voices.lobby ?
                            `<#${gset.get().voices.lobby}>` :
                            "**`Не установлен`**",
                        inline: true
                    },
                ]
            }],
            ephemeral: (gdb.get().channel == interaction.channel.id)
        });
    } else if (cmd == "toggle") {
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
            return await interaction.reply({
                content: idk,
                ephemeral: (gdb.get().channel == interaction.channel.id)
            });
        } else if (type == "purgePinned") {
            gset.get().purgePinned ? (() => {
                gset.set("purgePinned", false);
                idk = "**`Удаление закреплённых сообщений`** было выключено.";
            })() : (() => {
                gset.set("purgePinned", true);
                idk = "**`Удаление закреплённых сообщений`** было включено.";
            })();
            return await interaction.reply({
                content: idk,
                ephemeral: (gdb.get().channel == interaction.channel.id)
            });
        } else if (type == "voices") {
            gset.get().voices.enabled ? (() => {
                gset.setOnObject("voices", "enabled", false);
                idk = "**`Временные голосовые каналы`** были выключены.";
            })() : (() => {
                gset.setOnObject("voices", "enabled", true);
                idk = "**`Временные голосовые каналы`** были включены.";
            })();
            return await interaction.reply({
                content: idk,
                ephemeral: (gdb.get().channel == interaction.channel.id)
            });
        };
    } else if (cmd == "muterole") {
        await gset.set("muteRole", interaction.options.getRole("role").id);
        return interaction.reply({
            content: "✅ Роль мьюта была установлена." +
                (
                    interaction.guild.me.roles.cache.sort((a, b) => b.position - a.position).first().rawPosition <=
                        interaction.options.getRole("role").rawPosition ?
                        "\n⚠️ Установленная роль находится выше моей. Имейте ввиду, что команда мьюта при таком условии **работать не будет**" : ""
                ),
            ephemeral: true
        });
    } else if (cmd == "setlobby") {
        let lobby = interaction.options.getChannel("channel");
        gset.setOnObject("voices", "lobby", lobby.id);
        return interaction.reply({
            content: `✅ Лобби было установлено. (${lobby})`,
            ephemeral: (gdb.get().channel == interaction.channel.id)
        });
    } else if (cmd == "setchannel") {
        let counting = interaction.options.getChannel("channel");
        gdb.setMultiple({
            channel: counting.id,
            count: 0,
            user: "",
            message: (parseInt(interaction.id) + 1).toString()
        });
        interaction.reply({
            content: `✅ Канал счёта был установлен. (${counting})`,
            ephemeral: (gdb.get().channel == interaction.channel.id)
        });
    };
};