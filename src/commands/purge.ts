import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Удалить указанное количество сообщений в канале.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addIntegerOption((o) => o.setName("amount").setDescription("Amount of messages to delete.").setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName("member").setDescription("Only delete messages by this user."))
    .toJSON();

const cds = new Map<string, number>();
import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import prettyMs from "pretty-ms";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guildId);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    if (cds.has(interaction.channel.id))
        return interaction.reply({
            content: _("commands.purge.cd", { time: prettyMs(cds.get(interaction.channel.id) - Date.now()) }),
            ephemeral: true
        });
    else {
        cds.set(interaction.channel.id, Date.now() + 3100);
        setTimeout(() => cds.delete(interaction.channel.id), 3100);
    };

    if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages))
        return interaction.reply({ content: _("commands.purge.noperm"), ephemeral: true });

    await interaction.deferReply();

    const gsdb = await Util.database.settings(interaction.guild.id);
    const limit = interaction.options.getInteger("amount");

    let toDelete = await interaction.channel.messages.fetch({ limit, before: interaction.id });
    if (!gsdb.get().purgePinned) toDelete = toDelete.filter((m) => !m.pinned);
    if (interaction.options.getUser("member")) toDelete = toDelete.filter((m) => m.author.id === interaction.options.getUser("member").id);
    if (!toDelete.size) return interaction.editReply(_("commands.purge.nomessages"))
        .then(() => setTimeout(() => interaction.deleteReply(), 3000));

    const purged = await interaction.channel.bulkDelete(toDelete, true);

    return interaction.editReply(_("commands.purge.done", { amount: `${purged.size}` }))
        .then(() => setTimeout(() => interaction.deleteReply(), 3000));
};