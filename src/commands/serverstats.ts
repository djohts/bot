import { ChannelType, SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("serverstats")
    .setDescription("Manage stats channels.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addSubcommand(c =>
        c
            .setName("set")
            .setDescription("Set a stats channel.")
            .addChannelOption(o =>
                o
                    .setName("channel")
                    .setDescription("Channel.")
                    .addChannelTypes(
                        ChannelType.GuildCategory,
                        ChannelType.GuildText,
                        ChannelType.GuildVoice,
                        ChannelType.GuildNews,
                        ChannelType.GuildStageVoice
                    )
                    .setRequired(true)
            )
            .addStringOption(o =>
                o
                    .setName("text")
                    .setDescription("Template. For placehoolders check /docs")
                    .setRequired(true)
            )
    )
    .addSubcommand(c =>
        c
            .setName("delete")
            .setDescription("Delete a stats channel.")
            .addStringOption(o =>
                o
                    .setName("channel")
                    .setDescription("Channel ID.")
                    .setAutocomplete(true)
                    .setRequired(true)
            )
    )
    .addSubcommand(c =>
        c
            .setName("list")
            .setDescription("List all stats channels.")
    )
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guild.id);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    switch (interaction.options.getSubcommand()) {
        case "set":
            const channel = interaction.options.getChannel("channel");
            const text = interaction.options.getString("text").replace(/\`/g, "");

            const limit = 5;

            if (Object.keys(gdb.get().statschannels).length >= limit)
                return interaction.reply(_("commands.serverstats.set.limit", { amount: `${limit}` }));
            if (text.length > 64)
                return interaction.reply(_("commands.serverstats.set.template", { amount: "64" }));

            gdb.setOnObject("statschannels", channel.id, text);

            return interaction.reply(_("commands.serverstats.set.limit", { channel: `${channel}`, template: text }));
        case "delete":
            const channelId = interaction.options.getString("channel");
            gdb.removeFromObject("statschannels", channelId);

            return interaction.reply(_("commands.serverstats.delete.done"));
        case "list":
            const { statschannels } = gdb.get();
            const result: string[] = [];

            for (const [channelId, text] of Object.entries(statschannels)) {
                result.push([
                    `> <#${channelId}> (\`${channelId}\`)`,
                    `\`${text.replace(/\`/g, "")}\``
                ].join("\n"));
            };

            return interaction.reply({
                embeds: [{
                    title: _("commands.serverstats.list.title"),
                    description: result.join("\n\n") || _("commands.serverstats.list.empty")
                }]
            });
    };
};