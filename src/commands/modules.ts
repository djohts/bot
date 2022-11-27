import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("modules")
    .setDescription("Toggle counting modules.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, SelectMenuBuilder, ComponentType, ButtonStyle } from "discord.js";
import { getGuildDocument } from "../database";
import allModules from "../constants/modules";
import i18next from "i18next";

const names = {
    spam: "Allow spam",
    embed: "Embed",
    talking: "Talking",
    webhook: "Webhook"
};

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guild.id);
    const t = i18next.getFixedT(document.locale, null, "commands.modules");
    const { modules: oldModules } = document.counting;

    const m = await interaction.reply({
        fetchReply: true,
        components: [
            new ActionRowBuilder<SelectMenuBuilder>().setComponents([
                new SelectMenuBuilder()
                    .setPlaceholder(t("choose"))
                    .setCustomId("modules_menu")
                    .setMinValues(0)
                    .setMaxValues(4)
                    .setOptions(Object.keys(allModules).map((module) => ({
                        label: names[module],
                        value: module,
                        description: allModules[module].description,
                        default: oldModules.includes(module)
                    })))
            ])
        ]
    });

    const collector = m.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        componentType: ComponentType.StringSelect,
        time: 60 * 1000
    });

    collector.on("collect", () => collector.stop("a"));
    collector.on("end", (a, r) => {
        if (r !== "a") return void interaction.editReply({
            content: t("timedout"),
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents([
                    new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                ])
            ]
        });

        const newModules = a.first().values;

        if (newModules.includes("embed") && newModules.includes("webhook"))
            return void a.first().update({
                content: t("incompatible", { a: "Embed", b: "Webhook" }),
                components: [
                    new ActionRowBuilder<ButtonBuilder>().setComponents([
                        new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                    ])
                ]
            });

        const oldList = oldModules?.map((m) => `**${names[m]}**`).join(",") || t("empty");
        const newList = newModules?.map((m) => `**${names[m]}**`).join(",") || t("empty");

        document.counting.modules = newModules;
        document.safeSave();

        return void a.first().update({
            content: [
                t("changes"),
                t("old", { oldList }),
                t("new", { newList })
            ].join("\n"),
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents([
                    new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                ])
            ]
        });
    });
};