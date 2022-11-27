import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot latency.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import { getGuildDocument } from "../database";
import prettyms from "pretty-ms";
import table from "text-table";
import i18next from "i18next";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT(document.locale, null, "commands.ping");

    const then = Date.now();

    await interaction.deferReply();

    const server = Date.now() - then;
    const uptime = prettyms(interaction.client.uptime);
    const api = interaction.guild.shard.ping;

    const a = table([
        [t("server"), "::", `${server}ms`],
        [t("api"), "::", `${api}ms`],
        [t("uptime"), "::", uptime]
    ], { align: ["l", "c", "l"] });

    return interaction.editReply({
        embeds: [{
            title: t("pong"),
            description: [
                "```asciidoc",
                a,
                "```"
            ].join("\n")
        }]
    });
};