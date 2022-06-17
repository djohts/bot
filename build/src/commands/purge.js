"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("purge")
    .setDescription("Удалить указанное количество сообщений в канале.")
    .addIntegerOption((o) => o.setName("amount").setDescription("Количество сообщений которое надо удалить.").setRequired(true).setMinValue(2).setMaxValue(100))
    .addUserOption((o) => o.setName("member").setDescription("Участник, чьи сообщения должны быть очищены."))
    .toJSON();
exports.permission = 1;
const cds = new Map();
const pretty_ms_1 = __importDefault(require("pretty-ms"));
const database_1 = __importDefault(require("../database/"));
const run = async (interaction) => {
    if (cds.has(interaction.channel.id))
        return await interaction.reply({
            content: `❌ Подождите ещё ${(0, pretty_ms_1.default)(cds.get(interaction.channel.id) - Date.now())} перед повторным использованем команды.`,
            ephemeral: true
        });
    else {
        cds.set(interaction.channel.id, Date.now() + 4000);
        setTimeout(() => cds.delete(interaction.channel.id), 4000);
    }
    ;
    if (!interaction.channel.permissionsFor(interaction.guild.me).has("MANAGE_MESSAGES"))
        return await interaction.reply({ content: "❌ У меня нет прав на управление сообщениями в этом канале.", ephemeral: true });
    await interaction.deferReply();
    const gsdb = await database_1.default.settings(interaction.guild.id);
    const limit = interaction.options.getInteger("amount");
    let toDelete = await interaction.channel.messages.fetch({ limit, before: interaction.id });
    if (!gsdb.get().purgePinned)
        toDelete = toDelete.filter((m) => !m.pinned);
    if (interaction.options.getUser("member"))
        toDelete = toDelete.filter((m) => m.author.id == interaction.options.getUser("member").id);
    if (!toDelete.size)
        return await interaction.editReply({ content: "❌ Не удалось найти сообщений для удаления." })
            .then(() => setTimeout(() => interaction.deleteReply(), 3000));
    const purged = await interaction.channel.bulkDelete(toDelete, true).catch(() => false);
    if (!purged)
        return await interaction.editReply({ content: "❌ Не удалось удалить сообщения." })
            .then(() => setTimeout(() => interaction.deleteReply(), 3000));
    await interaction.editReply({
        content: "✅ Удалено " + (purged.size == 1 ?
            purged.size + " сообщение" :
            [2, 3, 4].includes(purged.size) ?
                purged.size + " сообщения" :
                purged.size + " сообщений") + (purged.size === toDelete.size ? "" : ` из ${toDelete.size}. ⚠️ Некоторые сообщения не были удалены так как они старше 2-х недель.`)
    });
    setTimeout(() => interaction.deleteReply().catch(() => null), 3000);
};
exports.run = run;
