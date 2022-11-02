import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("modules")
    .setDescription("Toggle counting modules.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, SelectMenuBuilder, ComponentType, ButtonStyle } from "discord.js";
import allModules from "../constants/modules";
import { getGuildDocument } from "../database";
import Util from "../util/Util";
const names = {
    spam: "Allow spam",
    embed: "Embed",
    talking: "Talking",
    webhook: "Webhook"
};

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guild.id);
    const _ = Util.i18n.getLocale(document.locale);
    const { modules: oldModules } = document.counting;

    const m = await interaction.reply({
        fetchReply: true,
        components: [
            new ActionRowBuilder<SelectMenuBuilder>().setComponents([
                new SelectMenuBuilder()
                    .setPlaceholder(_("commands.modules.choose"))
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
        componentType: ComponentType.SelectMenu,
        time: 60 * 1000
    });

    collector.on("collect", () => collector.stop("a"));
    collector.on("end", (a, r) => {
        if (r !== "a") return void interaction.editReply({
            content: _("commands.modules.timedout"),
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents([
                    new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                ])
            ]
        });

        const newModules = a.first().values;

        if (newModules.includes("embed") && newModules.includes("webhook"))
            return void a.first().update({
                content: _("commands.modules.incompatible", { a: "Embed", b: "Webhook" }),
                components: [
                    new ActionRowBuilder<ButtonBuilder>().setComponents([
                        new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                    ])
                ]
            });

        const oldList = oldModules?.map((m) => `**${names[m]}**`).join(",") || _("commands.modules.empty");
        const newList = newModules?.map((m) => `**${names[m]}**`).join(",") || _("commands.modules.empty");

        document.counting.modules = newModules;
        document.safeSave();

        return void a.first().update({
            content: [
                _("commands.modules.changes"),
                _("commands.modules.old", { oldList }),
                _("commands.modules.new", { newList })
            ].join("\n"),
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents([
                    new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                ])
            ]
        });
    });
};