import { ButtonInteraction, GuildMember } from "discord.js";
import db from "../database/";

export = async (interaction: ButtonInteraction) => {
    if (!(interaction.member instanceof GuildMember)) return;

    const guild = interaction.guild;
    if (
        !interaction.member.manageable ||
        !guild.me.permissions.has("MANAGE_ROLES")
    ) return await interaction.reply({ content: "❌ У меня нет прав на изменение ролей.", ephemeral: true });

    await interaction.deferReply({ ephemeral: true }).catch(() => null);

    const gdb = await db.guild(guild.id);
    const { brs } = gdb.get();
    const iId = interaction.customId.slice(3);
    const rId = brs[iId];

    const role = await interaction.guild.roles.fetch(rId).catch(() => null);
    if (
        !role ||
        (role.rawPosition > interaction.guild.me.roles.highest.rawPosition)
    ) return await interaction.editReply("❌ Роль не была найдена или её позиция выше моей.");

    interaction.member.roles.cache.has(role.id)
        ? await interaction.member.roles.remove(role)
            .then(async () => await interaction.editReply(`✅ Роль ${role} убрана.`))
            .catch(async (e) => {
                console.log(e);
                await interaction.editReply("❌ Произошла ошибка.");
            })
        : await interaction.member.roles.add(role)
            .then(async () => await interaction.editReply(`✅ Роль ${role} выдана.`))
            .catch(async (e) => {
                console.log(e);
                await interaction.editReply("❌ Произошла ошибка.");
            });
};