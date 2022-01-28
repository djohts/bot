module.exports = {
    name: "buttonroles",
    description: "Настройки ролей по кнопкам.",
    permissionRequired: 2,
    opts: [{
        name: "create",
        description: "Создать новую РПК.",
        type: 1,
        options: [{
            name: "channel",
            description: "Канал в котором будет создано РПК.",
            type: 7,
            required: true,
            channel_types: [0, 5]
        }, {
            name: "role",
            description: "Роль, которая будет выдаваться.",
            type: 8,
            required: true
        }, {
            name: "emoji",
            description: "Эмодзи. Используется для указания роли в панели и кнопке.",
            type: 3,
            required: true
        }, {
            name: "message",
            description: "Id сообщения в которое добавить РПК. Если не указать - бот отправит новое сообщение.",
            type: 3
        }]
    }, {
        name: "list",
        description: "Посмотреть список РПК этого сервера.",
        type: 1
    }, {
        name: "refresh",
        description: "Обновить все РПК в случае рассинхрона. (пока что не работает)",
        type: 1
    }, {
        name: "delete",
        description: "Удалить РПК.",
        type: 1,
        options: [{
            name: "id",
            description: "Id РПК, которую нужно удалить. (Id можно получить в /buttonroles list)",
            type: 3,
            required: true
        }]
    }],
    slash: true
};

const db = require("../database/")();
const { CommandInteraction, Collection, TextChannel } = require("discord.js");
const { generateID } = require("../constants/");
const { paginate } = require("../constants/resolvers");
const { deleteMessage } = require("../handlers/utils");

module.exports.run = async (interaction) => {
    if (!(interaction instanceof CommandInteraction)) return;

    const gdb = await db.guild(interaction.guild.id);
    const addToGlobal = db.global.addToArray;
    const cmd = interaction.options.getSubcommand();

    if (cmd == "create") {
        const channel = interaction.options.getChannel("channel");
        const messageId = interaction.options.getString("message");
        if (!(
            channel.permissionsFor(interaction.guild.me).has("READ_MESSAGE_HISTORY") ||
            channel.permissionsFor(interaction.guild.me).has("SEND_MESSAGES") ||
            channel.permissionsFor(interaction.guild.me).has("VIEW_CHANNEL")
        )) {
            return await interaction.reply({
                content: "❌ Недостаточно прав в укразанном канале. Проверьте наличие следующих прав: `VIEW_CHANNEL`, `READ_MESSAGE_HISTORY`, `SEND_MESSAGES`",
                ephemeral: true
            });
        };
        const role = interaction.options.getRole("role");
        if (
            role.rawPosition > interaction.guild.me.roles.highest.rawPosition ||
            role.managed ||
            interaction.guild.id == role.id
        ) {
            return await interaction.reply({
                content: "❌ Эту роль невозможно выдать.",
                ephemeral: true
            });
        };
        const emoji = interaction.options.getString("emoji").match(/\p{Extended_Pictographic}/ug)?.[0];
        if (!emoji) {
            return await interaction.reply({
                content: `❌ \`${interaction.options.getString("emoji")}\` не является действительным unicode-эмоджи.`,
                ephemeral: true
            });
        };
        await interaction.reply({
            content: "💢 Работаю...",
            ephemeral: true
        });
        const id = generateID();

        if (!messageId?.length) return await channel.send({
            embeds: [{
                title: "Выбор ролей",
                description: `${emoji} - ${role}`
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    emoji: { name: emoji },
                    style: 4,
                    custom_id: "br:" + id
                }]
            }]
        }).then(async (m) => {
            addToGlobal("generatedIds", id);
            gdb.setOnObject("brcs", id, channel.id);
            gdb.setOnObject("brms", id, m.id);
            gdb.setOnObject("brs", id, role.id);
            return await interaction.editReply({
                content: "✅ Готово."
            });
        });

        const message = await interaction.options.getChannel("channel").messages.fetch(messageId).catch(() => false);
        if (!message || !Object.values(gdb.get().brms).includes(message.id)) return await interaction.editReply("❌ Сообщение не было найдено.");
        if (message.components[0].components.length >= 5) {
            return await interaction.editReply("❌ На сообщении достигнут лимит РПК (5 штук).");
        };
        if (message.embeds[0].description.includes(role.id)) {
            return await interaction.editReply("❌ На этом сообщении уже есть РПК с этой ролью.");
        };
        message.components[0].components.push({
            type: 2,
            emoji: { name: emoji },
            style: 4,
            custom_id: "br:" + id
        });
        const newMessage = {
            embeds: [{
                title: "Выбор роли",
                description: message.embeds[0].description + `\n${emoji} - ${role}`
            }],
            components: [{
                type: 1,
                components: message.components[0].components
            }]
        };
        message.edit(newMessage).then(async (m) => {
            addToGlobal("generatedIds", id);
            gdb.setOnObject("brcs", id, channel.id);
            gdb.setOnObject("brms", id, m.id);
            gdb.setOnObject("brs", id, role.id);

            return await interaction.editReply("✅ Готово.");
        });
    } else if (cmd == "delete") {
        const brId = interaction.options.getString("id");
        const brc = gdb.get().brcs[brId];
        const brm = gdb.get().brms[brId];
        const br = gdb.get().brs[brId];

        await interaction.deferReply({ ephemeral: true }).catch(() => false);

        const channel = await interaction.guild.channels.fetch(brc).catch(() => false);
        if (
            !channel ||
            !(channel instanceof TextChannel)
        ) return await interaction.editReply(`✅ РПК \`${brId}\` было удалено.`).then(() => {
            gdb.removeFromObject("brcs", brId);
            gdb.removeFromObject("brms", brId);
            gdb.removeFromObject("brs", brId);
        });
        const message = await channel.messages.fetch(brm).catch(() => false);
        if (!message) return await interaction.editReply(`✅ РПК \`${brId}\` было удалено.`).then(() => {
            gdb.removeFromObject("brcs", brId);
            gdb.removeFromObject("brms", brId);
            gdb.removeFromObject("brs", brId);
        });

        const newMessage = {
            embeds: [{
                title: "Выбор роли",
                description: message.embeds[0].description.split("\n").filter((a) => !a.includes(br))?.join("\n")
            }],
            components: [{
                type: 1,
                components: message.components[0].components.filter((a) => !a.customId.includes(brId))
            }]
        };
        if (
            !newMessage.embeds[0].description?.length ||
            !newMessage.components[0].components?.length
        ) return await interaction.editReply(`✅ РПК \`${brId}\` было удалено.`).then(() => {
            deleteMessage(message);
            gdb.removeFromObject("brcs", brId);
            gdb.removeFromObject("brms", brId);
            gdb.removeFromObject("brs", brId);
        });
        return await message.edit(newMessage).then(async () => {
            return await interaction.editReply(`✅ РПК \`${brId}\` было удалено.`).then(() => {
                gdb.removeFromObject("brcs", brId);
                gdb.removeFromObject("brms", brId);
                gdb.removeFromObject("brs", brId);
            });
        });
    } else if (cmd == "list") {
        const { brcs: brcs1, brms: brms1, brs: brs1 } = gdb.get();
        const brcs = new Collection();
        const brms = new Collection();
        const brs = new Collection();

        for (const key in brcs1) brcs.set(key, brcs1[key]);
        for (const key in brms1) brms.set(key, brms1[key]);
        for (const key in brs1) brs.set(key, brs1[key]);

        const channelObject = new Collection();
        const messageObject = new Collection();
        const channelsFlat = [...new Set(brcs.values())];

        channelsFlat.map((channelId) => {
            const channelBrIds = [...brcs.filter((v) => v == channelId).keys()];
            channelBrIds.map((i) => {
                const messageId = brms.get(i);
                const messageBrIds = [...brms.filter((v) => v == messageId).keys()];
                messageObject.set(messageId, brs.filter((_, x) => messageBrIds.includes(x)).map((roleId, brId) => `${brId}.${roleId}`));
            });
            channelObject.set(channelId, messageObject.filter((_, messageId) => channelBrIds.includes(brms.findKey((v) => v == messageId))));
        });

        const formattedArray = channelObject.map((messages, channelId) => {
            return `<#${channelId}>:\n` + messages.map((brList, messageId) => {
                return `**- \`${messageId}\`:**\n` + brList.map((x) => {
                    const a = x.split(".");
                    return `> \`${a[0]}\` - <@&${a[1]}> (\`${a[1]}\`)`;
                }).join("\n");
            }).join("\n");
        });
        const paginated = paginate(formattedArray, 1);
        let page = 0;

        return await interaction.reply({
            embeds: [{
                title: `Список РПК - ${interaction.guild.name}`,
                description: paginated[page]?.join("\n"),
                footer: {
                    text: `Страница: ${page + 1}/${paginated.length}`
                }
            }],
            fetchReply: true,
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    emoji: { name: "⏮️" },
                    style: 2,
                    custom_id: "brlist:page:first",
                    disabled: page == 0
                }, {
                    type: 2,
                    emoji: { name: "◀️" },
                    style: 2,
                    custom_id: "brlist:page:prev",
                    disabled: page == 0
                }, {
                    type: 2,
                    emoji: { name: "▶️" },
                    style: 2,
                    custom_id: "brlist:page:next",
                    disabled: (paginated.length - 1) <= page
                }, {
                    type: 2,
                    emoji: { name: "⏭️" },
                    style: 2,
                    custom_id: "brlist:page:last",
                    disabled: (paginated.length - 1) <= page
                }]
            }]
        }).then((m) => {
            const collector = m.createMessageComponentCollector({
                componentType: "BUTTON",
                filter: (x) => x.user.id == interaction.user.id,
                idle: 60 * 1000
            });

            collector.on("collect", async (i) => {
                if (i.customId == "brlist:page:first") {
                    page = 0;
                    await i.update({
                        embeds: [{
                            title: `Список РПК - ${interaction.guild.name}`,
                            description: paginated[page]?.join("\n"),
                            footer: {
                                text: `Страница: ${page + 1}/${paginated.length}`
                            }
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                emoji: { name: "⏮️" },
                                style: 2,
                                custom_id: "brlist:page:first",
                                disabled: page == 0
                            }, {
                                type: 2,
                                emoji: { name: "◀️" },
                                style: 2,
                                custom_id: "brlist:page:prev",
                                disabled: page == 0
                            }, {
                                type: 2,
                                emoji: { name: "▶️" },
                                style: 2,
                                custom_id: "brlist:page:next",
                                disabled: (paginated.length - 1) == page
                            }, {
                                type: 2,
                                emoji: { name: "⏭️" },
                                style: 2,
                                custom_id: "brlist:page:last",
                                disabled: (paginated.length - 1) == page
                            }]
                        }]
                    });
                } else if (i.customId == "brlist:page:prev") {
                    page--;
                    await i.update({
                        embeds: [{
                            title: `Список РПК - ${interaction.guild.name}`,
                            description: paginated[page]?.join("\n"),
                            footer: {
                                text: `Страница: ${page + 1}/${paginated.length}`
                            }
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                emoji: { name: "⏮️" },
                                style: 2,
                                custom_id: "brlist:page:first",
                                disabled: page == 0
                            }, {
                                type: 2,
                                emoji: { name: "◀️" },
                                style: 2,
                                custom_id: "brlist:page:prev",
                                disabled: page == 0
                            }, {
                                type: 2,
                                emoji: { name: "▶️" },
                                style: 2,
                                custom_id: "brlist:page:next",
                                disabled: (paginated.length - 1) == page
                            }, {
                                type: 2,
                                emoji: { name: "⏭️" },
                                style: 2,
                                custom_id: "brlist:page:last",
                                disabled: (paginated.length - 1) == page
                            }]
                        }]
                    });
                } else if (i.customId == "brlist:page:next") {
                    page++;
                    await i.update({
                        embeds: [{
                            title: `Список РПК - ${interaction.guild.name}`,
                            description: paginated[page]?.join("\n"),
                            footer: {
                                text: `Страница: ${page + 1}/${paginated.length}`
                            }
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                emoji: { name: "⏮️" },
                                style: 2,
                                custom_id: "brlist:page:first",
                                disabled: page == 0
                            }, {
                                type: 2,
                                emoji: { name: "◀️" },
                                style: 2,
                                custom_id: "brlist:page:prev",
                                disabled: page == 0
                            }, {
                                type: 2,
                                emoji: { name: "▶️" },
                                style: 2,
                                custom_id: "brlist:page:next",
                                disabled: (paginated.length - 1) == page
                            }, {
                                type: 2,
                                emoji: { name: "⏭️" },
                                style: 2,
                                custom_id: "brlist:page:last",
                                disabled: (paginated.length - 1) == page
                            }]
                        }]
                    });
                } else if (i.customId == "brlist:page:last") {
                    page = paginated.length - 1;
                    await i.update({
                        embeds: [{
                            title: `Список РПК - ${interaction.guild.name}`,
                            description: paginated[page]?.join("\n"),
                            footer: {
                                text: `Страница: ${page + 1}/${paginated.length}`
                            }
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                emoji: { name: "⏮️" },
                                style: 2,
                                custom_id: "brlist:page:first",
                                disabled: page == 0
                            }, {
                                type: 2,
                                emoji: { name: "◀️" },
                                style: 2,
                                custom_id: "brlist:page:prev",
                                disabled: page == 0
                            }, {
                                type: 2,
                                emoji: { name: "▶️" },
                                style: 2,
                                custom_id: "brlist:page:next",
                                disabled: (paginated.length - 1) == page
                            }, {
                                type: 2,
                                emoji: { name: "⏭️" },
                                style: 2,
                                custom_id: "brlist:page:last",
                                disabled: (paginated.length - 1) == page
                            }]
                        }]
                    });
                };
            });
            collector.on("end", async () => await interaction.deleteReply().catch(() => false));
        });
    };
};