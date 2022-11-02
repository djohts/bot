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
import { getGuildDocument } from "../database";
import { GuildLocale } from "../../types";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guild.id);
    const _ = Util.i18n.getLocale(document.locale);
    const cmd = interaction.options.getSubcommand();

    if (cmd === "get") {
        return interaction.reply({
            embeds: [{
                title: _("commands.settings.get.settings"),
                fields: [{
                    name: _("commands.settings.get.purgepinned"),
                    value: document.settings.purgePinned ?
                        _("commands.settings.get.enabled") :
                        _("commands.settings.get.disabled"),
                    inline: true
                }, {
                    name: _("commands.settings.get.tempvcs"),
                    value: document.settings.voices_enabled ?
                        _("commands.settings.get.enabled") :
                        _("commands.settings.get.disabled"),
                    inline: true
                }, {
                    name: _("commands.settings.get.tempvclobby"),
                    value: document.settings.voices_lobby ?
                        `<#${document.settings.voices_lobby}>` :
                        _("commands.settings.get.notset"),
                    inline: true
                }]
            }]
        });
    } else if (cmd === "toggle") {
        const type = interaction.options.getString("setting");
        let idk = "";

        if (type === "purgePinned") {
            document.settings.purgePinned ? (() => {
                document.settings.purgePinned = false;
                idk = _("commands.settings.toggle.disabled");
            })() : (() => {
                document.settings.purgePinned = true;
                idk = _("commands.settings.toggle.enabled");
            })();
        } else if (type === "voices") {
            document.settings.voices_enabled ? (() => {
                document.settings.voices_enabled = false;
                idk = _("commands.settings.toggle.disabled");
            })() : (() => {
                document.settings.voices_enabled = true;
                idk = _("commands.settings.toggle.enabled");
            })();
        };

        document.safeSave();
        return interaction.reply(idk);
    } else if (cmd === "locale") {
        const locale = interaction.options.getString("locale") as GuildLocale;

        document.locale = locale;
        document.safeSave();

        return interaction.reply(_("commands.settings.locale", { locale }))
    } else if (cmd === "setlobby") {
        const lobby = interaction.options.getChannel("channel");

        document.settings.voices_lobby = lobby.id;
        document.safeSave();

        return interaction.reply(_("commands.settings.lobbyset", { channel: `${lobby}` }));
    } else if (cmd === "counting") {
        const channel = interaction.options.getChannel("channel");

        document.counting = {
            channelId: channel.id,
            count: 0,
            userId: "",
            messageId: interaction.id
        };
        document.safeSave();

        return interaction.reply(_("commands.settings.countingset", { channel: `${channel}` }));
    };
};