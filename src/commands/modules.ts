import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("modules")
    .setDescription("Настроить модули счёта.")
    .toJSON();
export const permission = 2;

import db from "../database/";
import { CommandInteraction, Message, MessageActionRow, MessageButton, MessageSelectMenu } from "discord.js";
import { modules as allModules } from "../constants/modules";
const names = {
    "allow-spam": "Allow spam",
    "embed": "Embed",
    "talking": "Talking",
    "webhook": "Webhook"
};

export const run = async (interaction: CommandInteraction): Promise<any> => {
    const gdb = await db.guild(interaction.guild.id);
    const { modules: oldModules } = gdb.get();

    const m = await interaction.reply({
        content: "​", // U+200b
        fetchReply: true,
        components: [
            new MessageActionRow().setComponents([
                new MessageSelectMenu()
                    .setPlaceholder("Выберите модули")
                    .setCustomId("modules_menu")
                    .setMinValues(0)
                    .setMaxValues(4)
                    .setOptions(Object.keys(allModules).map((module) => ({
                        label: names[module],
                        value: module,
                        description: allModules[module].short,
                        default: oldModules.includes(module)
                    })))
            ])
        ]
    }) as Message;

    const collector = m.createMessageComponentCollector({
        filter: (i) => i.customId === "modules_menu" && i.user.id === interaction.user.id,
        componentType: "SELECT_MENU",
        time: 60 * 1000,
        idle: 30 * 1000
    });
    collector.on("collect", () => collector.stop("abc"));
    collector.on("end", async (a, r): Promise<void> => {
        if ("abc" != r) await interaction.editReply({
            content: "Время вышло.",
            components: [
                new MessageActionRow().setComponents([
                    new MessageButton().setCustomId("reply:delete").setStyle("DANGER").setEmoji("🗑")
                ])
            ]
        });
        else {
            const newModules = a.first()?.values;

            if (newModules.includes("embed") && newModules.includes("webhook"))
                return await a.first().update({
                    content: "Модули **Embed** и **Webhook** несовместимы.",
                    components: [
                        new MessageActionRow().setComponents([
                            new MessageButton().setCustomId("reply:delete").setStyle("DANGER").setEmoji("🗑")
                        ])
                    ]
                });

            const oldList = oldModules?.map((m) => names[m]).join("**, **") || "Пусто";
            const newList = newModules?.map((m) => names[m]).join("**, **") || "Пусто";

            gdb.set("modules", newModules);
            await a.first().update({
                content: [
                    "​> **Изменения:**",
                    `Прошлые модули: **${oldList}**`,
                    `Новые модули: **${newList}**`
                ].join("\n"),
                components: [
                    new MessageActionRow().setComponents([
                        new MessageButton().setCustomId("reply:delete").setStyle("DANGER").setEmoji("🗑")
                    ])
                ]
            });
        };
    });
};