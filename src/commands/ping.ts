import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot latency.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import prettyms from "pretty-ms";
import Util from "../util/Util";
import table from "text-table";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guildId);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    const then = Date.now();

    await interaction.deferReply();

    const server = Date.now() - then;
    const uptime = prettyms(interaction.client.uptime);
    const api = interaction.guild.shard.ping;

    const a = table([
        [_("commands.ping.server"), "::", `${server}ms`],
        [_("commands.ping.api"), "::", `${api}ms`],
        [_("commands.ping.uptime"), "::", uptime]
    ], { align: ["l", "c", "l"] });

    return interaction.editReply({
        embeds: [{
            title: _("commands.ping.pong"),
            description: [
                "```asciidoc",
                a,
                "```"
            ].join("\n")
        }]
    });
};