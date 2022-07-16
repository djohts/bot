"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const Util_1 = __importDefault(require("../util/Util"));
module.exports = async (interaction) => {
    const gdb = await Util_1.default.database.guild(interaction.guild.id);
    const { brs } = gdb.get();
    const member = interaction.member;
    const guild = interaction.guild;
    if (!guild.me.permissions.has("MANAGE_ROLES"))
        return await interaction.reply({ content: "❌ У меня нет прав на изменение ролей.", ephemeral: true });
    await interaction.deferReply({ ephemeral: true }).catch(() => null);
    const iId = interaction.customId.slice(3);
    const rId = brs[iId];
    const role = await interaction.guild.roles.fetch(rId).catch(() => null);
    if (!role || (role.rawPosition > interaction.guild.me.roles.highest.rawPosition))
        return await interaction.editReply("❌ Роль не была найдена или её позиция выше моей.");
    member.roles.cache.has(role.id)
        ? await member.roles.remove(role)
            .then(async () => await interaction.editReply(`✅ Роль ${role} убрана.`))
            .catch(async (e) => {
            console.log(e);
            await interaction.editReply("❌ Произошла ошибка.");
        })
        : await member.roles.add(role)
            .then(async () => await interaction.editReply(`✅ Роль ${role} выдана.`))
            .catch(async (e) => {
            console.log(e);
            await interaction.editReply("❌ Произошла ошибка.");
        });
};
