import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("siren")
    .setDescription("Ukraine Air Raid Siren map.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addSubcommand((c) =>
        c.setName("set").setDescription("Set channel where the message will be.").addChannelOption((o) =>
            o.setName("channel").setDescription("Channel where the message will be.").addChannelTypes(0, 5)
        )
    )
    .toJSON();

import { PermissionFlagsBits, ChatInputCommandInteraction, TextChannel } from "discord.js";
import { getGuildDocument } from "../database";
import { generateId } from "../constants";
import i18next from "i18next";

export const run = async (interaction: ChatInputCommandInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT<any, any>(document.locale, null, "commands.siren");
    const cmd = interaction.options.getSubcommand();

    if (cmd === "set") {
        const channel = (interaction.options.getChannel("channel", false) ?? interaction.channel) as TextChannel;
        const me = await interaction.guild.members.fetchMe();

        if (
            !channel.permissionsFor(me).has(PermissionFlagsBits.ViewChannel)
            || !channel.permissionsFor(me).has(PermissionFlagsBits.ReadMessageHistory)
            || !channel.permissionsFor(me).has(PermissionFlagsBits.SendMessages)
        ) return interaction.reply({
            content: t("set.noPerms", { perms: "`ViewChannel`, `ReadMessageHistory`, `SendMessages`" }),
            ephemeral: true
        });

        if (Array.from(document.sirens.keys()).length)
            document.sirens.delete(Array.from(document.sirens.keys())[0]!);
        document.safeSave();

        await interaction.deferReply({ ephemeral: true }).catch(() => null);

        const message = await channel.send(t("set.loading"));
        const id = generateId(4);

        document.sirens.set(id, {
            id: id,
            channelId: channel.id,
            messageId: message.id
        });
        document.safeSave();

        return void interaction.editReply(t("set.done"));
    };
};