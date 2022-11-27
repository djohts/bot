import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Purge messages in current channel.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addIntegerOption((o) => o.setName("amount").setDescription("Amount of messages to delete.").setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName("member").setDescription("Only delete messages by this user."))
    .toJSON();

import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { getGuildDocument } from "../database";
import prettyMs from "pretty-ms";
import i18next from "i18next";

const cds = new Map<string, number>();

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT(document.locale, null, "commands.purge");

    if (cds.has(interaction.channel.id))
        return interaction.reply({
            content: t("cd", { time: prettyMs(cds.get(interaction.channel.id) - Date.now()) }),
            ephemeral: true
        });
    else {
        cds.set(interaction.channel.id, Date.now() + 3500);
        setTimeout(() => cds.delete(interaction.channel.id), 3500);
    };

    if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages))
        return interaction.reply({ content: t("noperm"), ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const limit = interaction.options.getInteger("amount");

    let toDelete = await interaction.channel.messages.fetch({ limit, before: interaction.id });
    if (!document.settings.purgePinned) toDelete = toDelete.filter((m) => !m.pinned);
    if (interaction.options.getUser("member")) toDelete = toDelete.filter((m) => m.author.id === interaction.options.getUser("member").id);
    if (!toDelete.size) return interaction.editReply(t("nomessages"));

    const purged = await interaction.channel.bulkDelete(toDelete, true);

    return interaction.editReply(t("done", { count: purged.size }));
};