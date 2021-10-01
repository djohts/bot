module.exports = {
    name: "settings",
    permissionRequired: 1,
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
        }
    ],
    slash: true
};

const { CommandInteraction, MessageEmbed } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction = new CommandInteraction) => {
    const guilddb = await db.guild(interaction.guild.id);

    switch (interaction.options.getSubcommand()) {
        case "get":
            return await interaction.reply({
                embeds: [{
                    title: "Настройки " + interaction.guild.name,
                    timestamp: Date.now(),
                    fields: [
                        {
                            name: "Удаление сообщений замьюченых участников.",
                            value: guilddb.get().settings.delMuted ? "<:online:887393623845507082> **`Включено`**" : "<:dnd:887393623786803270> **`Выключено`**",
                            inline: true
                        }
                    ]
                }]
            });
        case "toggle":
            let idk = "";
            if (interaction.options.getString("setting") == "delMuted")
                guilddb.get().settings.delMuted ? (() => {
                    guilddb.setOnObject("settings", "delMuted", false);
                    idk = "**`Удаление сообщений замьюченых участников`** было выключено.";
                })() : (() => {
                    guilddb.setOnObject("settings", "delMuted", true);
                    idk = "**`Удаление сообщений замьюченых участников`** было включено.";
                })();
            return await interaction.reply(idk);
    };
};