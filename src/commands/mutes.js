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
        }
    ],
    slash: true
};

const { CommandInteraction, MessageEmbed } = require("discord.js");
const { parseTime, getPermissionLevel } = require("../constants/");
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
            if (interaction.options.getUser("member").bot)
                return interaction.reply({ content: "❌ Вы не можете замьютить бота.", ephemeral: true });
            if (getPermissionLevel(interaction.options.getMember("member")) >= 1)
                return interaction.reply({ content: "❌ Вы не можете замьютить этого человека.", ephemeral: true });

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
            if (!guilddb.get().mutes[interaction.options.getUser("member")])
                return interaction.reply({ content: "❌ Этот участник не замьючен.", ephemeral: true });

            interaction.options.getMember("member").roles.remove(guilddb.get().settings.muteRole).then(async () => {
                guilddb.removeFromObject("mutes", interaction.options.getMember("member").user.id);
                await interaction.reply("s");
            }).catch();
            break;
    };
};