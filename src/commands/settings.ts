import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Manage bot settings.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addSubcommand((c) => c.setName("get").setDescription("Get all bot settings."))
    .addSubcommand((c) => c.setName("toggle").setDescription("Toggle an option.").addStringOption((o) =>
        o.setName("setting").setDescription("Option.").setRequired(true)
            .setChoices({
                name: "Purge pinned messages. (/purge)",
                value: "purgePinned"
            }, {
                name: "Voice rooms.",
                value: "voices"
            })
    ))
    .addSubcommand((c) => c.setName("locale").setDescription("Change bot locale in this guild.").addStringOption((o) =>
        o.setName("locale").setDescription("Locale.").setRequired(true)
            .setChoices({
                name: "English",
                value: "en"
            }, {
                name: "Українська",
                value: "ua"
            }, {
                name: "Русский",
                value: "ru"
            })
    ))
    .addSubcommand((c) => c.setName("setlobby").setDescription("Set voice rooms lobby.").addChannelOption((o) =>
        o.setName("channel").setDescription("Channel.").setRequired(true).addChannelTypes(2)
    ))
    .addSubcommand((c) => c.setName("counting").setDescription("Set a counting channel.").addChannelOption((o) =>
        o.setName("channel").setDescription("Channel.").setRequired(true).addChannelTypes(0)
    ))
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gset = await Util.database.settings(interaction.guild.id);
    const gdb = await Util.database.guild(interaction.guild.id);
    const _ = Util.i18n.getLocale(gdb.get().locale);
    const cmd = interaction.options.getSubcommand();

    if (cmd === "get") {
        return interaction.reply({
            embeds: [{
                title: _("commands.settings.get.settings"),
                fields: [{
                    name: _("commands.settings.get.purgepinned"),
                    value: gset.get().purgePinned ?
                        _("commands.settings.get.enabled") :
                        _("commands.settings.get.disabled"),
                    inline: true
                }, {
                    name: _("commands.settings.get.tempvcs"),
                    value: gset.get().voices.enabled ?
                        _("commands.settings.get.enabled") :
                        _("commands.settings.get.disabled"),
                    inline: true
                }, {
                    name: _("commands.settings.get.tempvclobby"),
                    value: gset.get().voices.lobby ?
                        `<#${gset.get().voices.lobby}>` :
                        _("commands.settings.get.notset"),
                    inline: true
                }]
            }]
        });
    } else if (cmd === "toggle") {
        const type = interaction.options.getString("setting");
        let idk = "";

        if (type === "purgePinned") {
            gset.get().purgePinned ? (() => {
                gset.set("purgePinned", false);
                idk = _("commands.settings.toggle.disabled");
            })() : (() => {
                gset.set("purgePinned", true);
                idk = _("commands.settings.toggle.enabled");
            })();
        } else if (type === "voices") {
            gset.get().voices.enabled ? (() => {
                gset.setOnObject("voices", "enabled", false);
                idk = _("commands.settings.toggle.disabled");
            })() : (() => {
                gset.setOnObject("voices", "enabled", true);
                idk = _("commands.settings.toggle.enabled");
            })();
        };

        return interaction.reply(idk);
    } else if (cmd === "locale") {
        const locale = interaction.options.getString("locale");

        gdb.set("locale", locale);

        return interaction.reply(_("commands.settings.locale", { locale }))
    } else if (cmd === "setlobby") {
        const lobby = interaction.options.getChannel("channel");

        gset.setOnObject("voices", "lobby", lobby.id);

        return interaction.reply(_("commands.settings.lobbyset", { channel: `${lobby}` }));
    } else if (cmd === "counting") {
        const channel = interaction.options.getChannel("channel");

        gdb.setMultiple({
            channel: channel.id,
            count: 0,
            user: "",
            message: interaction.id
        });

        return interaction.reply(_("commands.settings.countingset", { channel: `${channel}` }));
    };
};