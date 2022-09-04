import { ComponentType, GuildMember, SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Управлять предупреждениями.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addSubcommand((c) =>
        c.setName("add").setDescription("Добавить предупреждение пользователю.")
            .addUserOption((u) => u.setName("user").setDescription("Пользователь для добавления предупреждения.").setRequired(true))
            .addStringOption((s) => s.setName("reason").setDescription("Причина для добавления предупреждения.").setMaxLength(512))
    )
    .addSubcommand((c) =>
        c.setName("list").setDescription("Показать список предупреждений всего сервера или пользователя.")
            .addUserOption((u) => u.setName("user").setDescription("Пользователь для показа списка предупреждений."))
    )
    .addSubcommand((c) =>
        c.setName("remove").setDescription("Убрать предупреждение.")
            .addStringOption((s) => s.setName("warnid").setDescription("Id предупреждения.").setRequired(true).setAutocomplete(true))
    )
    .toJSON();

import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    InteractionReplyOptions,
    InteractionUpdateOptions,
    ChatInputCommandInteraction
} from "discord.js";
import { paginate } from "../constants/resolvers";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await interaction.client.util.database.guild(interaction.guild.id);

    switch (interaction.options.getSubcommand()) {
        case "add":
            const user = interaction.options.getUser("user");
            const reason = interaction.options.getString("reason");

            if (user.id === interaction.user.id)
                return interaction.reply("❌ Вы не можете выдать предупреждение самому себе.");

            const member = await interaction.guild.members.fetch(user.id).catch(() => false as false);
            if (
                member
                && member.roles.highest.rawPosition >= (interaction.member as GuildMember).roles.highest.rawPosition
            ) return interaction.reply("❌ Вы не можете выдать предупреждение участнику с вышей ролью.");

            const newData = gdb.addWarn(user.id, interaction.user.id, reason);
            const warnId = newData.warns[newData.warns.length - 1].id;

            return interaction.reply({
                content: `✅ Пользователю ${user} было выдано предупреждение \`${warnId}\`${reason ? ` по причине: ${reason}` : "."}`,
                allowedMentions: { parse: [] }
            });
        case "list":
            await interaction.deferReply();

            const { warns } = gdb.get();
            const users = await interaction.guild.members.fetch({
                user: [...warns.map((x) => x.userId), ...warns.map((x) => x.actionedById)],
                time: 1000 * 30
            }).catch(() => false as false);
            if (!users) return interaction.editReply("❌ Не удалось получить список пользователей. Попроуйте через несколько секунд.");

            const mappedWarnings = gdb.get().warns.reverse().map(({ id, userId, actionedById, timestamp, reason }) => {
                const userTag = users.get(userId)?.user.tag.replace(/\*/g, "\\*") ?? "Unknown#0000";
                const seconds = Math.round(timestamp / 1000);

                return [
                    `> \`${id}\` | <@${userId}> (**${userTag}**) | <@${actionedById}> | <t:${seconds}:f> (<t:${seconds}:R>)`,
                    `${reason ?? "Не указана."}`
                ].join("\n");
            });
            const pages = paginate(mappedWarnings, 5);
            let page = 0;

            await interaction.editReply({ content: null, ...generateMessage(pages, page) });

            const collector = (await interaction.fetchReply()).createMessageComponentCollector({
                filter: (i) => i.user.id === interaction.user.id,
                componentType: ComponentType.Button,
                time: 1000 * 60 * 5
            });

            collector.on("collect", async (i) => {
                if (i.customId === "warns:page:first") {
                    page = 0;
                    await i.update(generateMessage(pages, page));
                } else if (i.customId === "warns:page:prev") {
                    page -= 1;
                    await i.update(generateMessage(pages, page));
                } else if (i.customId === "warns:page:next") {
                    page += 1;
                    await i.update(generateMessage(pages, page));
                } else if (i.customId === "warns:page:last") {
                    page = pages.length - 1;
                    await i.update(generateMessage(pages, page));
                };
            });

            collector.on("end", async () => {
                await interaction.deleteReply().catch(() => 0);
            });
            return;
        case "remove":
            gdb.removeWarn(interaction.options.getString("warnid"));

            return interaction.reply("✅ Предупреждение успешно удалено.");
    };
};

const generateMessage = (pages: string[][], page: number): InteractionReplyOptions & InteractionUpdateOptions => {
    return {
        embeds: [
            new EmbedBuilder()
                .setTitle("Список предупреждений")
                .setDescription(pages[page]?.join("\n") || "Тут пусто")
                .setFooter({ text: `Страница: ${page + 1}/${pages.length}` })
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>().setComponents([
                new ButtonBuilder().setCustomId("warns:page:first").setEmoji("⏮️").setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
                new ButtonBuilder().setCustomId("warns:page:prev").setEmoji("◀️").setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
                new ButtonBuilder().setCustomId("warns:page:next").setEmoji("▶️").setStyle(ButtonStyle.Secondary).setDisabled(pages.length - 1 <= page),
                new ButtonBuilder().setCustomId("warns:page:last").setEmoji("⏭️").setStyle(ButtonStyle.Secondary).setDisabled(pages.length - 1 <= page)
            ])
        ]
    };
};