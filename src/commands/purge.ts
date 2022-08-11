import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Удалить указанное количество сообщений в канале.")
    .addIntegerOption((o) => o.setName("amount").setDescription("Количество сообщений которое надо удалить.").setRequired(true).setMinValue(2).setMaxValue(100))
    .addUserOption((o) => o.setName("member").setDescription("Участник, чьи сообщения должны быть очищены."))
    .toJSON();
export const permission = 1;

const cds = new Map<string, number>();
import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import prettyMs from "pretty-ms";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    if (cds.has(interaction.channel.id))
        return await interaction.reply({
            content: `❌ Подождите ещё ${prettyMs(cds.get(interaction.channel.id) - Date.now())} перед повторным использованем команды.`,
            ephemeral: true
        });
    else {
        cds.set(interaction.channel.id, Date.now() + 4000);
        setTimeout(() => cds.delete(interaction.channel.id), 4000);
    };

    if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages))
        return await interaction.reply({ content: "❌ У меня нет прав на управление сообщениями в этом канале.", ephemeral: true });

    await interaction.deferReply();

    const gsdb = await Util.database.settings(interaction.guild.id);

    const limit = interaction.options.getInteger("amount");

    let toDelete = await interaction.channel.messages.fetch({ limit, before: interaction.id });
    if (!gsdb.get().purgePinned) toDelete = toDelete.filter((m) => !m.pinned);
    if (interaction.options.getUser("member")) toDelete = toDelete.filter((m) => m.author.id == interaction.options.getUser("member").id);
    if (!toDelete.size) return await interaction.editReply({ content: "❌ Не удалось найти сообщений для удаления." })
        .then(() => setTimeout(() => interaction.deleteReply(), 3000));

    const purged = await interaction.channel.bulkDelete(toDelete, true).catch(() => null);
    if (!purged) return await interaction.editReply({ content: "❌ Не удалось удалить сообщения." })
        .then(() => setTimeout(() => interaction.deleteReply(), 3000));

    await interaction.editReply({
        content:
            "✅ Удалено " + (
                purged.size == 1 ?
                    purged.size + " сообщение" :
                    [2, 3, 4].includes(purged.size) ?
                        purged.size + " сообщения" :
                        purged.size + " сообщений"
            ) + (
                purged.size === toDelete.size ? "" : ` из ${toDelete.size}. ⚠️ Некоторые сообщения не были удалены так как они старше 2-х недель.`
            )
    });
    setTimeout(() => interaction.deleteReply().catch(() => null), 3000);
};