module.exports = {
    name: "mutes",
    permissionRequired: 1,
    opts: [
        {
            name: "add",
            description: "Выдать мьют участнику.",
            type: 1,
            options: [
                {
                    name: "member",
                    description: "Участник, которому надо выдать мьют.",
                    type: 6,
                    required: true
                },
                {
                    name: "time",
                    description: "Время, на которое участнику надо выдать мьют.",
                    type: 3
                },
                {
                    name: "reason",
                    description: "Причина выдачи мьюта.",
                    type: 3
                }
            ]
        },
        {
            name: "remove",
            description: "Убрать мьют в участника.",
            type: 1,
            options: [
                {
                    name: "member",
                    description: "Участник, у которого надо снять мьют.",
                    type: 6,
                    required: true
                }
            ]
        },
        {
            name: "role",
            description: "Роль, которая будет выдаваться участнику при выдаче мьюта.",
            type: 1,
            options: [
                {
                    name: "role",
                    description: "Роль.",
                    type: 8,
                    required: true
                }
            ]
        }
    ],
    slash: true
};

const { CommandInteraction, MessageEmbed } = require("discord.js");
const { parseTime } = require("../constants/");
const db = require("../database/")();

module.exports.run = async (interaction = new CommandInteraction) => {
    const guilddb = await db.guild(interaction.guild.id);

    switch (interaction.options.getSubcommand(true)) {
        case "add":
            const role = interaction.guild.roles.cache.get(guilddb.get().settings.muteRole);
            if (!role) return interaction.reply({ content: "❌ Не удалось найти роль мьюта или она находится выше моей.", ephemeral: true });
            if (interaction.guild.me.roles.cache.first().rawPosition <= role.rawPosition)
                return interaction.reply({ content: "❌ Роль мьюта находится выше моей.", ephemeral: true });
            if (!interaction.guild.me.permissions.has("MANAGE_ROLES"))
                return interaction.reply({ content: "❌ У меня нет права на выдачу ролей.", ephemeral: true });

            interaction.options.getMember("member").roles.add(role).then(async () => {
                let time = 0;
                if (!interaction.options.getString("time")?.length) time = -1;
                else time = Date.now() + parseTime(interaction.options.getString("time"));

                guilddb.setOnObject("mutes", interaction.options.getMember("member").user.id, time);
                await interaction.guild.members.fetch(interaction.options.getMember("member")).then((member) => member.user.createDM().then((dm) => {
                    dm.send({
                        embeds: [{
                            author: {
                                name: interaction.guild.name,
                                iconURL: interaction.guild.iconURL({ format: "png", dynamic: true }),
                                url: "https://discord.com/channels/" + interaction.guild.id
                            },
                            title: "Вы были замьючены",
                            fields: [
                                {
                                    name: "Модератор",
                                    value: `${interaction.user.toString()} (**${interaction.user.tag.replace("*", "\\*")}**)`
                                }
                            ]
                        }]
                    }).then(() => { }).catch();
                })).catch();
            }).catch(() => interaction.reply({ content: "❌ Не удалось выдать роль участнику... У меня есть право на изменение ролей?", ephemeral: true }));

            return interaction.reply("sda");

        case "remove":
            guilddb.removeFromObject("mutes", interaction.options.getMember("member").user.id);
            interaction.options.getMember("member").roles.remove(guilddb.get().settings.muteRole).then().catch();
            return interaction.reply("s");

        case "role":
            await guilddb.setOnObject("settings", "muteRole", interaction.options.getRole("role").id);
            return interaction.reply({
                content: "✅ Роль была установлена." +
                    (interaction.guild.me.roles.cache.first().rawPosition <= interaction.options.getRole("role").rawPosition ?
                        "\n⚠️Установленная роль находится выше моей. Имейте ввиду, что команда мьюта при таком условии **работать не будет**" : ""),
                ephemeral: true
            });
    };
};