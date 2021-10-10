module.exports = {
    name: "purge",
    description: "Удалить указанное количество сообщений в канале.",
    permissionRequired: 1,
    opts: [
        {
            name: "amount",
            description: "Количество сообщений которое надо удалить. От 2 до 100.",
            type: 10,
            required: true
        },
        {
            name: "member",
            description: "Участник, чьи сообщения должны быть очищены.",
            type: 6
        }
    ],
    slash: true
};

const cooldowns = new Set();
const { CommandInteraction } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction = new CommandInteraction) => {
    if (cooldowns.has(interaction.guild.id))
        return interaction.reply({ content: "❌ Подождите несколько секунд перед повторным использованем команды.", ephemeral: true });
    else cooldowns.add(interaction.guild.id) && setTimeout(() => cooldowns.delete(interaction.guild.id), 2000);

    const guilddb = await db.guild(interaction.guild.id);

    if (!interaction.channel.permissionsFor(interaction.guild.me).has("MANAGE_MESSAGES"))
        return await interaction.reply({ content: "❌ У меня нет прав на управление сообщениями в этом канале.", ephemeral: true });

    const limit = interaction.options.getNumber("amount");
    if (limit > 100) return await interaction.reply({ content: "❌ На данный момент удаление больше 100 сообщений не поддерживается.", ephemeral: true });
    if (limit < 2) return await interaction.reply({ content: "❌ Количество сообщений для удаления должно быть больше чем 2.", ephemeral: true });

    let toDelete = await interaction.channel.messages.fetch({ limit: limit });
    if (!guilddb.get().purgePinned) toDelete = toDelete.filter(m => !m.pinned);
    if (interaction.options.getUser("member")) toDelete = toDelete.filter(m => m.author.id == interaction.options.getUser("member").id);
    if (!toDelete.size) return await interaction.reply({ content: "❌ Не удалось найти сообщений для удаления.", ephemeral: true });

    const purged = await interaction.channel.bulkDelete(toDelete, true);

    return await interaction.reply({
        content: (
            purged.size ?
                "✅ Удалено " + (
                    purged.size == 1 ?
                        purged.size + " сообщение" :
                        [2, 3, 4].includes(purged.size) ?
                            purged.size + " сообщения" :
                            purged.size + " сообщений"
                ) :
                "Произошла ошибка при подсчёте удалённых сообщений."
        ),
        ephemeral: true
    });
};
