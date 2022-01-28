const { ButtonInteraction } = require("discord.js");
const db = require("../database/")();

module.exports = async (interaction) => {
    if (!(interaction instanceof ButtonInteraction)) return;

    const guild = interaction.guild;
    if (!guild.me.permissions.has("MANAGE_ROLES")) {
        return await interaction.reply({
            content: "❌ У меня нет прав на управление ролями (в т.ч. их выдачу).",
            ephemeral: true
        });
    };

    await interaction.deferReply({ ephemeral: true }).catch(() => false);

    const gdb = await db.guild(guild.id);
    const { brs } = gdb.get();
    const iId = interaction.customId.slice(3);
    const rId = brs[iId];

    const role = await interaction.guild.roles.fetch(rId).catch(() => false);
    if (
        !role ||
        (role.rawPosition > interaction.guild.me.roles.highest.rawPosition)
    ) {
        return await interaction.editReply("❌ Роль не была найдена или её позиция выше моей.");
    };

    if (interaction.member.roles.cache.has(role.id)) {
        return await interaction.member.roles.remove(role).then(async () => {
            return await interaction.editReply(`✅ Роль ${role} убрана.`);
        }).catch(async (e) => {
            console.log(e);
            return await interaction.editReply("❌ Произошла неизвестная ошибка. Скажите Администрации связаться с разработчиком на сервере поддержки.");
        });
    } else {
        return await interaction.member.roles.add(role).then(async () => {
            return await interaction.editReply(`✅ Роль ${role} выдана.`);
        }).catch(async (e) => {
            console.log(e);
            return await interaction.editReply("❌ Произошла неизвестная ошибка. Скажите Администрации связаться с разработчиком на сервере поддержки.");
        });
    };
};