"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("buttonroles")
    .setDescription("Настройки РПК.")
    .addSubcommand((c) => c.setName("create").setDescription("Создать новую РПК.").addChannelOption((o) => o.setName("channel").setDescription("Канал в котором будет создано РПК.").setRequired(true).addChannelTypes([0, 5]))
    .addRoleOption((o) => o.setName("role").setDescription("Роль, которая будет выдаваться.").setRequired(true))
    .addStringOption((o) => o.setName("emoji").setDescription("Эмодзи. Используется для указания роли в панели и кнопке.").setRequired(true))
    .addStringOption((o) => o.setName("message").setDescription("Id сообщения в которое добавить РПК. Если не указать - бот отправит новое сообщение.")))
    .addSubcommand((c) => c.setName("list").setDescription("Посмотреть список РПК этого сервера."))
    .addSubcommand((c) => c.setName("delete").setDescription("Удалить РПК.").addStringOption((o) => o.setName("id").setDescription("Id РПК, которую нужно удалить. (Id можно получить в /buttonroles list)").setRequired(true)))
    .toJSON();
exports.permission = 2;
const database_1 = __importDefault(require("../database/"));
const discord_js_1 = require("discord.js");
const constants_1 = require("../constants/");
const resolvers_1 = require("../constants/resolvers");
const utils_1 = require("../handlers/utils");
const run = async (interaction) => {
    const gdb = await database_1.default.guild(interaction.guild.id);
    const addToGlobal = database_1.default.global.addToArray;
    const cmd = interaction.options.getSubcommand();
    if (cmd == "create") {
        const channel = interaction.options.getChannel("channel");
        const messageId = interaction.options.getString("message");
        if (!(channel.permissionsFor(interaction.guild.me).has("READ_MESSAGE_HISTORY") ||
            channel.permissionsFor(interaction.guild.me).has("SEND_MESSAGES") ||
            channel.permissionsFor(interaction.guild.me).has("VIEW_CHANNEL"))) {
            return await interaction.reply({
                content: "❌ Недостаточно прав в укразанном канале. Проверьте наличие следующих прав: `VIEW_CHANNEL`, `READ_MESSAGE_HISTORY`, `SEND_MESSAGES`",
                ephemeral: true
            });
        }
        ;
        const role = interaction.options.getRole("role");
        if (role.rawPosition > interaction.guild.me.roles.highest.rawPosition ||
            role.managed ||
            interaction.guild.id == role.id) {
            return await interaction.reply({
                content: "❌ Эту роль невозможно выдать.",
                ephemeral: true
            });
        }
        ;
        const emoji = interaction.options.getString("emoji").match(/\p{Extended_Pictographic}/ug)?.[0];
        if (!emoji) {
            return await interaction.reply({
                content: `❌ \`${interaction.options.getString("emoji")}\` не является действительным unicode-эмоджи.`,
                ephemeral: true
            });
        }
        ;
        await interaction.reply({
            content: "💢 Работаю...",
            ephemeral: true
        });
        const id = (0, constants_1.generateID)();
        if (!messageId?.length)
            return await channel.send({
                embeds: [{
                        title: "Выбор ролей",
                        description: `${emoji} - ${role}`
                    }],
                components: [
                    new discord_js_1.MessageActionRow().setComponents([
                        new discord_js_1.MessageButton()
                            .setCustomId(`br:${id}`)
                            .setEmoji(emoji)
                            .setStyle("DANGER")
                    ])
                ]
            }).then(async (m) => {
                addToGlobal("generatedIds", id);
                gdb.setOnObject("brcs", id, channel.id);
                gdb.setOnObject("brms", id, m.id);
                gdb.setOnObject("brs", id, role.id);
                await interaction.editReply({
                    content: "✅ Готово."
                });
            });
        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message || !Object.values(gdb.get().brms).includes(message.id))
            return await interaction.editReply("❌ Сообщение не было найдено.");
        if (message.components[0].components.length >= 5) {
            return await interaction.editReply("❌ На сообщении достигнут лимит РПК (5 штук).");
        }
        ;
        if (message.embeds[0].description.includes(role.id)) {
            return await interaction.editReply("❌ На этом сообщении уже есть РПК с этой ролью.");
        }
        ;
        message.components[0].components.push(new discord_js_1.MessageButton()
            .setCustomId(`br:${id}`)
            .setEmoji(emoji)
            .setStyle("DANGER"));
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
        await message.edit(newMessage).then(async (m) => {
            addToGlobal("generatedIds", id);
            gdb.setOnObject("brcs", id, channel.id);
            gdb.setOnObject("brms", id, m.id);
            gdb.setOnObject("brs", id, role.id);
            await interaction.editReply("✅ Готово.");
        }).catch(async (e) => {
            console.error(e);
            await interaction.reply("❌ Произошла ошибка.");
        });
    }
    else if (cmd == "delete") {
        const brId = interaction.options.getString("id");
        const brc = gdb.get().brcs[brId];
        const brm = gdb.get().brms[brId];
        const br = gdb.get().brs[brId];
        await interaction.deferReply({ ephemeral: true }).catch(() => null);
        const channel = await interaction.guild.channels.fetch(brc).catch(() => null);
        if (!channel ||
            !(channel instanceof discord_js_1.TextChannel))
            return await interaction.editReply(`✅ РПК \`${brId}\` было удалено.`).then(() => {
                gdb.removeFromObject("brcs", brId);
                gdb.removeFromObject("brms", brId);
                gdb.removeFromObject("brs", brId);
            });
        const message = await channel.messages.fetch(brm).catch(() => null);
        if (!message)
            return await interaction.editReply(`✅ РПК \`${brId}\` было удалено.`).then(() => {
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
        if (!newMessage.embeds[0].description?.length ||
            !newMessage.components[0].components?.length)
            return await interaction.editReply(`✅ РПК \`${brId}\` было удалено.`).then(() => {
                (0, utils_1.deleteMessage)(message);
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
    }
    else if (cmd == "list") {
        const { brcs: brcs1, brms: brms1, brs: brs1 } = gdb.get();
        const brcs = new discord_js_1.Collection();
        const brms = new discord_js_1.Collection();
        const brs = new discord_js_1.Collection();
        for (const key in brcs1)
            brcs.set(key, brcs1[key]);
        for (const key in brms1)
            brms.set(key, brms1[key]);
        for (const key in brs1)
            brs.set(key, brs1[key]);
        const channelObject = new discord_js_1.Collection();
        const messageObject = new discord_js_1.Collection();
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
        const paginated = (0, resolvers_1.paginate)(formattedArray, 1);
        let page = 0;
        await interaction.reply(generateMessage(interaction, paginated, page)).then((m) => {
            const collector = m.createMessageComponentCollector({
                componentType: "BUTTON",
                filter: (x) => x.user.id == interaction.user.id,
                idle: 60 * 1000
            });
            collector.on("collect", async (i) => {
                if (i.customId == "brlist:page:first") {
                    page = 0;
                    await i.update(generateMessage(interaction, paginated, page));
                }
                else if (i.customId == "brlist:page:prev") {
                    page--;
                    await i.update(generateMessage(interaction, paginated, page));
                }
                else if (i.customId == "brlist:page:next") {
                    page++;
                    await i.update(generateMessage(interaction, paginated, page));
                }
                else if (i.customId == "brlist:page:last") {
                    page = paginated.length - 1;
                    await i.update(generateMessage(interaction, paginated, page));
                }
                ;
            });
            collector.on("end", async () => await interaction.deleteReply().catch(() => null));
        });
    }
    ;
};
exports.run = run;
const generateMessage = (interaction, pages, page) => {
    return {
        embeds: [
            new discord_js_1.MessageEmbed()
                .setTitle(`Список РПК - ${interaction.guild.name}`)
                .setDescription(pages[page]?.join("\n") || "Тут пусто")
                .setFooter({ text: `Страница: ${page + 1}/${pages.length}` })
        ],
        fetchReply: true,
        components: [
            new discord_js_1.MessageActionRow().setComponents([
                new discord_js_1.MessageButton().setCustomId("brlist:page:first").setEmoji("⏮️").setStyle("SECONDARY").setDisabled(page <= 0),
                new discord_js_1.MessageButton().setCustomId("brlist:page:prev").setEmoji("◀️").setStyle("SECONDARY").setDisabled(page <= 0),
                new discord_js_1.MessageButton().setCustomId("brlist:page:next").setEmoji("▶️").setStyle("SECONDARY").setDisabled(pages.length - 1 <= page),
                new discord_js_1.MessageButton().setCustomId("brlist:page:last").setEmoji("⏭️").setStyle("SECONDARY").setDisabled(pages.length - 1 <= page)
            ])
        ]
    };
};
