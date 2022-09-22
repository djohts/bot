import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("modules")
    .setDescription("Toggle counting modules.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction, Message, ActionRowBuilder, ButtonBuilder, SelectMenuBuilder, ComponentType, ButtonStyle } from "discord.js";
import { modules as allModules } from "../constants/modules";
import Util from "../util/Util";
const names = {
    "allow-spam": "Allow spam",
    "embed": "Embed",
    "talking": "Talking",
    "webhook": "Webhook"
};

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guild.id);
    const _ = Util.i18n.getLocale(gdb.get().locale);
    const { modules: oldModules } = gdb.get();

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
                        description: allModules[module].short,
                        default: oldModules.includes(module)
                    })))
            ])
        ]
    }) as Message;

    const collector = m.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        componentType: ComponentType.SelectMenu,
        time: 60 * 1000,
        idle: 30 * 1000
    });
    collector.on("collect", () => collector.stop("abc"));
    collector.on("end", async (a, r): Promise<void> => {
        if (r !== "abc") await interaction.editReply({
            content: _("commands.modules.timedout"),
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents([
                    new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                ])
            ]
        });
        else {
            const newModules = a.first()?.values;

            if (newModules.includes("embed") && newModules.includes("webhook")) {
                await a.first().update({
                    content: _("commands.modules.incompatible", { a: "Embed", b: "Webhook" }),
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().setComponents([
                            new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                        ])
                    ]
                });
                return;
            };

            const oldList = oldModules?.map((m) => `**${names[m]}**`).join(",") || _("commands.modules.empty");
            const newList = newModules?.map((m) => `**${names[m]}**`).join(",") || _("commands.modules.empty");

            gdb.set("modules", newModules);
            await a.first().update({
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
        };
    });
};