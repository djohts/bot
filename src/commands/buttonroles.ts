import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("buttonroles")
    .setDescription("Настройки РПК.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addSubcommand((c) =>
        c.setName("create").setDescription("Создать новую РПК.").addChannelOption((o) =>
            o.setName("channel").setDescription("Канал в котором будет создано РПК.").setRequired(true).addChannelTypes(0, 5)
        )
            .addRoleOption((o) =>
                o.setName("role").setDescription("Роль, которая будет выдаваться.").setRequired(true)
            )
            .addStringOption((o) =>
                o.setName("emoji").setDescription("Эмодзи. Используется для указания роли в панели и кнопке.").setRequired(true)
            )
            .addStringOption((o) =>
                o.setName("message").setDescription("Id сообщения в которое добавить РПК. Если не указать - бот отправит новое сообщение.")
            )
    )
    .addSubcommand((c) => c.setName("list").setDescription("Посмотреть список РПК этого сервера."))
    .addSubcommand((c) =>
        c.setName("delete").setDescription("Удалить РПК.").addStringOption((o) =>
            o.setName("id").setDescription("Id РПК, которую нужно удалить. (Id можно получить в /buttonroles list)").setRequired(true)
        )
    )
    .toJSON();

import {
    ButtonStyle,
    ComponentType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Collection,
    TextChannel,
    Message,
    Role,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    InteractionReplyOptions,
    InteractionUpdateOptions
} from "discord.js";
import { clientLogger } from "../util/logger/normal";
import { paginate } from "../constants/resolvers";
import { queueDelete } from "../handlers/utils";
import { generateID } from "../constants/";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guild.id);
    const global = await Util.database.global();
    const cmd = interaction.options.getSubcommand();

    if (cmd === "create") {
        const channel = interaction.options.getChannel("channel") as TextChannel;
        const messageId = interaction.options.getString("message");
        if (
            !channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel)
            || !channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ReadMessageHistory)
            || !channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)
        ) {
            return interaction.reply({
                content: "❌ Недостаточно прав в укразанном канале. Проверьте наличие следующих прав: `ViewChannel`, `ReadMessageHistory`, `SendMessages`",
                ephemeral: true
            });
        };
        const role = interaction.options.getRole("role") as Role;
        if (
            role.rawPosition > interaction.guild.members.me.roles.highest.rawPosition ||
            role.managed ||
            interaction.guild.id === role.id
        ) {
            return interaction.reply({
                content: "❌ Эту роль невозможно выдать.",
                ephemeral: true
            });
        };
        const emoji = interaction.options.getString("emoji").match(/\p{Extended_Pictographic}/ug)?.[0];
        if (!emoji) {
            return interaction.reply({
                content: `❌ \`${interaction.options.getString("emoji")}\` не является действительным unicode-эмоджи.`,
                ephemeral: true
            });
        };
        await interaction.reply({
            content: "💢 Работаю...",
            ephemeral: true
        });
        const id = generateID();

        if (!messageId) return channel.send({
            embeds: [{
                title: "Выбор ролей",
                description: `${emoji} - ${role}`
            }],
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents([
                    new ButtonBuilder()
                        .setCustomId(`br:${id}`)
                        .setEmoji(emoji)
                        .setStyle(ButtonStyle.Danger)
                ])
            ]
        }).then((m) => {
            gdb.setOnObject("brcs", id, channel.id);
            gdb.setOnObject("brms", id, m.id);
            gdb.setOnObject("brs", id, role.id);
            interaction.editReply({
                content: "✅ Готово."
            });
        });

        const message: Message | 0 = await channel.messages.fetch(messageId).catch(() => 0);
        if (!message || !Object.values(gdb.get().brms).includes(message.id)) return interaction.editReply("❌ Сообщение не было найдено.");
        if (message.components[0].components.length >= 5) {
            return interaction.editReply("❌ На сообщении достигнут лимит РПК (5 штук).");
        };
        if (message.embeds[0].description.includes(role.id)) {
            return interaction.editReply("❌ На этом сообщении уже есть РПК с этой ролью.");
        };
        (message.components[0].components as unknown as ButtonBuilder[]).push(
            new ButtonBuilder()
                .setCustomId(`br:${id}`)
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Danger)
        );
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
        await message.edit(newMessage).then((m) => {
            gdb.setOnObject("brcs", id, channel.id);
            gdb.setOnObject("brms", id, m.id);
            gdb.setOnObject("brs", id, role.id);

            interaction.editReply("✅ Готово.");
        }).catch((e) => {
            clientLogger.error(e);
            interaction.reply("❌ Произошла ошибка.");
        });
    } else if (cmd === "delete") {
        const brId = interaction.options.getString("id");
        const brc = gdb.get().brcs[brId];
        const brm = gdb.get().brms[brId];
        const br = gdb.get().brs[brId];

        await interaction.deferReply({ ephemeral: true }).catch(() => null);

        const channel = interaction.guild.channels.resolve(brc);
        if (
            !channel ||
            !(channel instanceof TextChannel)
        ) return interaction.editReply(`✅ РПК \`${brId}\` было удалено.`).then(() => {
            gdb.removeFromObject("brcs", brId);
            gdb.removeFromObject("brms", brId);
            gdb.removeFromObject("brs", brId);
        });

        const message: Message | null = await channel.messages.fetch(brm).catch(() => null);
        if (!message) return interaction.editReply(`✅ РПК \`${brId}\` было удалено.`).then(() => {
            gdb.removeFromObject("brcs", brId);
            gdb.removeFromObject("brms", brId);
            gdb.removeFromObject("brs", brId);
        });

        const newMessage = {
            embeds: [{
                title: "Выбор роли",
                description: message.embeds[0].description.split("\n").filter((a) => !a.includes(br)).join("\n")
            }],
            components: [{
                type: 1,
                components: message.components[0].components.filter((a) => !a.customId.includes(brId))
            }]
        };
        if (
            !newMessage.embeds[0].description?.length ||
            !newMessage.components[0].components?.length
        ) return interaction.editReply(`✅ РПК \`${brId}\` было удалено.`).then(() => {
            queueDelete([message]);
            gdb.removeFromObject("brcs", brId);
            gdb.removeFromObject("brms", brId);
            gdb.removeFromObject("brs", brId);
        });

        return message.edit(newMessage).then(async () => {
            await interaction.editReply(`✅ РПК \`${brId}\` было удалено.`);
            gdb.removeFromObject("brcs", brId);
            gdb.removeFromObject("brms", brId);
            gdb.removeFromObject("brs", brId);
        });
    } else if (cmd === "list") {
        const { brcs: brcs1, brms: brms1, brs: brs1 } = gdb.get();
        const brcs = new Collection<string, string>();
        const brms = new Collection<string, string>();
        const brs = new Collection<string, string>();

        for (const key in brcs1) brcs.set(key, brcs1[key]);
        for (const key in brms1) brms.set(key, brms1[key]);
        for (const key in brs1) brs.set(key, brs1[key]);

        const channelObject = new Collection<string, typeof messageObject>();
        const messageObject = new Collection<string, string[]>();
        const channelIds = [...new Set(brcs.values())];

        channelIds.map((channelId) => {
            const channelBrIds = [...brcs.filter((v) => v === channelId).keys()];
            channelBrIds.map((i) => {
                const messageId = brms.get(i);
                const messageBrIds = [...brms.filter((v) => v === messageId).keys()];
                messageObject.set(messageId, brs.filter((_, x) => messageBrIds.includes(x)).map((roleId, brId) => `${brId}.${roleId}`));
            });
            channelObject.set(channelId, messageObject.filter((_, messageId) => channelBrIds.includes(brms.findKey((v) => v === messageId))));
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

        return interaction.reply(generateMessage(interaction, paginated, page)).then((m: any) => {
            const collector = (m as Message).createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: (x) => x.user.id === interaction.user.id,
                idle: 60 * 1000
            });

            collector.on("collect", async (i) => {
                if (i.customId === "brlist:page:first") {
                    page = 0;
                    await i.update(generateMessage(interaction, paginated, page));
                } else if (i.customId === "brlist:page:prev") {
                    page--;
                    await i.update(generateMessage(interaction, paginated, page));
                } else if (i.customId === "brlist:page:next") {
                    page++;
                    await i.update(generateMessage(interaction, paginated, page));
                } else if (i.customId === "brlist:page:last") {
                    page = paginated.length - 1;
                    await i.update(generateMessage(interaction, paginated, page));
                };
            });
            collector.on("end", () => interaction.deleteReply().catch(() => null));
        });
    };
};

const generateMessage = (interaction: ChatInputCommandInteraction, pages: string[][], page: number): InteractionReplyOptions & InteractionUpdateOptions => {
    return {
        embeds: [
            new EmbedBuilder()
                .setTitle(`Список РПК - ${interaction.guild.name}`)
                .setDescription(pages[page]?.join("\n") || "Тут пусто")
                .setFooter({ text: `Страница: ${page + 1}/${pages.length}` })
        ],
        fetchReply: true,
        components: [
            new ActionRowBuilder<ButtonBuilder>().setComponents([
                new ButtonBuilder().setCustomId("brlist:page:first").setEmoji("⏮️").setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
                new ButtonBuilder().setCustomId("brlist:page:prev").setEmoji("◀️").setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
                new ButtonBuilder().setCustomId("brlist:page:next").setEmoji("▶️").setStyle(ButtonStyle.Secondary).setDisabled(pages.length - 1 <= page),
                new ButtonBuilder().setCustomId("brlist:page:last").setEmoji("⏭️").setStyle(ButtonStyle.Secondary).setDisabled(pages.length - 1 <= page)
            ])
        ]
    };
};