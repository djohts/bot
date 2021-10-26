module.exports = {
    name: "settings",
    permissionRequired: 2,
    opts: [
        {
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
        }
    ],
    slash: true
};

const { CommandInteraction } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction = new CommandInteraction) => {
    const gset = await db.settings(interaction.guild.id);

    switch (interaction.options.getSubcommand()) {
        case "get":
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
                    ]
                }]
            });
        case "toggle":
            let idk = "";
            switch (interaction.options.getString("setting")) {
                case "delMuted":
                    gset.get().delMuted ? (() => {
                        gset.set("delMuted", false);
                        idk = "**`Удаление сообщений замьюченых участников`** было выключено.";
                    })() : (() => {
                        gset.set("delMuted", true);
                        idk = "**`Удаление сообщений замьюченых участников`** было включено.";
                    })();
                    return await interaction.reply(idk);
                case "purgePinned":
                    gset.get().purgePinned ? (() => {
                        gset.set("purgePinned", false);
                        idk = "**`Удаление закреплённых сообщений`** было выключено.";
                    })() : (() => {
                        gset.set("purgePinned", true);
                        idk = "**`Удаление закреплённых сообщений`** было включено.";
                    })();
                    return await interaction.reply(idk);
            };
            break;
        case "muterole":
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
    };
};