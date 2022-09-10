import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Удалить указанное количество сообщений в канале.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addIntegerOption((o) => o.setName("amount").setDescription("Количество сообщений которое надо удалить.").setRequired(true).setMinValue(2).setMaxValue(100))
    .addUserOption((o) => o.setName("member").setDescription("Участник, чьи сообщения должны быть очищены."))
    .toJSON();

const cds = new Map<string, number>();
import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import prettyMs from "pretty-ms";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    if (cds.has(interaction.channel.id))
        return interaction.reply({
            content: `❌ Подождите ещё ${prettyMs(cds.get(interaction.channel.id) - Date.now())} перед повторным использованем команды.`,
            ephemeral: true
        });
    else {
        cds.set(interaction.channel.id, Date.now() + 3000);
        setTimeout(() => cds.delete(interaction.channel.id), 3000);
    };

    if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages))
        return interaction.reply({ content: "❌ У меня нет прав на управление сообщениями в этом канале.", ephemeral: true });

    await interaction.deferReply();

    const gsdb = await Util.database.settings(interaction.guild.id);
    const limit = interaction.options.getInteger("amount");

    let toDelete = await interaction.channel.messages.fetch({ limit, before: interaction.id });
    if (!gsdb.get().purgePinned) toDelete = toDelete.filter((m) => !m.pinned);
    if (interaction.options.getUser("member")) toDelete = toDelete.filter((m) => m.author.id === interaction.options.getUser("member").id);
    if (!toDelete.size) return interaction.editReply("❌ Не удалось найти сообщений для удаления.")
        .then(() => setTimeout(() => interaction.deleteReply(), 3000));

    const purged = await interaction.channel.bulkDelete(toDelete, true).catch(() => 0 as const);
    if (!purged) return interaction.editReply("❌ Не удалось удалить сообщения.")
        .then(() => setTimeout(() => interaction.deleteReply(), 3000));

    return interaction.editReply(
        "✅ Удалено " + (
            purged.size === 1 ?
                purged.size + " сообщение" :
                [2, 3, 4].includes(purged.size) ?
                    purged.size + " сообщения" :
                    purged.size + " сообщений"
        ) + (
            purged.size === toDelete.size ? "" : ` из ${toDelete.size}. ⚠️ Некоторые сообщения не были удалены так как они старше 2-х недель.`
        )
    ).then(() => setTimeout(() => interaction.deleteReply(), 3000));
};