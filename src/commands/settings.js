const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    options: new SlashCommandBuilder()
        .setName("settings")
        .setDescription("Настройки бота на сервере.")
        .addSubcommand((c) => c.setName("get").setDescription("Получить настройки сервера."))
        .addSubcommand((c) => c.setName("toggle").setDescription("Изменить значение найстройки.").addStringOption((o) =>
            o.setName("setting").setDescription("Настройка, которую надо изменить.").setRequired(true).setChoices([
                ["Удаление сообщений замьюченых участников.", "delMuted"],
                ["Удаление закреплённых сообщений при очистке (/purge).", "purgePinned"],
                ["Временные голосовые каналы.", "voices"],
                ["Проверка сообщений на вредоносные ссылки.", "detectScamLinks"]
            ])
        ))
        .addSubcommand((c) => c.setName("muterole").setDescription("Установить роль мьюта.").addRoleOption((o) =>
            o.setName("role").setDescription("Роль.").setRequired(true)
        ))
        .addSubcommand((c) => c.setName("setlobby").setDescription("Установить лобби для голосовых каналов.").addChannelOption((o) =>
            o.setName("channel").setDescription("Канал-генератор, в который надо зайти для создания временного канала.").setRequired(true).addChannelType(2)
        ))
        .addSubcommand((c) => c.setName("counting").setDescription("Настройки модуля счёта.").addChannelOption((o) =>
            o.setName("channel").setDescription("Текстовый канал в котором пользователи смогут считать циферки.").setRequired(true).addChannelType(0)
        ))
        .toJSON(),
    permission: 2
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
                        name: "Удаление закреплённых сообщений",
                        value: gset.get().purgePinned ?
                            "<:online:887393623845507082> **`Включено`**" :
                            "<:dnd:887393623786803270> **`Выключено`**",
                        inline: true
                    },
                    {
                        name: "Удаление сообщений замьюченых участников",
                        value: gset.get().delMuted ?
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
                    {
                        name: "Проверка сообщений на вредоносные ссылки.",
                        value: gset.get().detectScamLinks ?
                            "<:online:887393623845507082> **`Включено`**" :
                            "<:dnd:887393623786803270> **`Выключено`**",
                        inline: true
                    }
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
        } else if (type == "detectScamLinks") {
            gset.get().detectScamLinks ? (() => {
                gset.set("detectScamLinks", false);
                idk = "**`Проверка сообщений на вредоносные ссылки`** была выключена.";
            })() : (() => {
                gset.set("detectScamLinks", true);
                idk = "**`Проверка сообщений на вредоносные ссылки`** была включена.";
            })();
            return await interaction.reply({
                content: idk,
                ephemeral: (gdb.get().channel == interaction.channel.id)
            });
        };;
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