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
import i18next from "i18next";

export const run = async (interaction: ChatInputCommandInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT<any, any>(document.locale, null, "commands.settings");
    const cmd = interaction.options.getSubcommand();

    if (cmd === "get") {
        return interaction.reply({
            embeds: [{
                title: t("get.settings"),
                fields: [{
                    name: t("get.purgepinned"),
                    value: document.settings.purgePinned ?
                        t("get.enabled") :
                        t("get.disabled"),
                    inline: true
                }, {
                    name: t("get.tempvcs"),
                    value: document.settings.voices_enabled ?
                        t("get.enabled") :
                        t("get.disabled"),
                    inline: true
                }, {
                    name: t("get.tempvclobby"),
                    value: document.settings.voices_lobby ?
                        `<#${document.settings.voices_lobby}>` :
                        t("get.notset"),
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
                idk = t("toggle.disabled");
            })() : (() => {
                document.settings.purgePinned = true;
                idk = t("toggle.enabled");
            })();
        } else if (type === "voices") {
            document.settings.voices_enabled ? (() => {
                document.settings.voices_enabled = false;
                idk = t("toggle.disabled");
            })() : (() => {
                document.settings.voices_enabled = true;
                idk = t("toggle.enabled");
            })();
        };

        document.safeSave();
        return interaction.reply(idk);
    } else if (cmd === "locale") {
        const locale = interaction.options.getString("locale") as GuildLocale;

        document.locale = locale;
        document.safeSave();

        return interaction.reply(t("locale", { locale }))
    } else if (cmd === "setlobby") {
        const lobby = interaction.options.getChannel("channel", true);

        document.settings.voices_lobby = lobby.id;
        document.safeSave();

        return interaction.reply(t("lobbyset", { channel: `${lobby}` }));
    } else if (cmd === "counting") {
        const channel = interaction.options.getChannel("channel", true);

        document.counting = {
            channelId: channel.id,
            count: 0,
            userId: "",
            messageId: interaction.id,
            modules: document.counting.modules,
            scores: document.counting.scores
        };
        document.safeSave();

        return interaction.reply(t("countingset", { channel: `${channel}` }));
    };
};