import { ButtonInteraction, GuildMember, PermissionFlagsBits, Role } from "discord.js";
import Util from "../util/Util";
import { clientLogger } from "../util/logger/normal";

export = async (interaction: ButtonInteraction) => {
    const gdb = await Util.database.guild(interaction.guild.id);
    const { brs } = gdb.get();
    const member = interaction.member as GuildMember;
    const guild = interaction.guild;

    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles))
        return interaction.reply({ content: "❌ У меня нет прав на изменение ролей.", ephemeral: true });

    await interaction.deferReply({ ephemeral: true }).catch(() => null);

    const iId = interaction.customId.slice(3);
    const rId = brs[iId];

    const role: Role | null = await interaction.guild.roles.fetch(rId).catch(() => null);
    if (!role || (role.rawPosition > interaction.guild.members.me.roles.highest.rawPosition))
        return interaction.editReply("❌ Роль не была найдена или её позиция выше моей.");

    return member.roles.cache.has(role.id)
        ? member.roles.remove(role)
            .then(() => interaction.editReply(`✅ Роль ${role} убрана.`))
            .catch((e) => {
                clientLogger.error(e);
                interaction.editReply("❌ Произошла ошибка.");
            })
        : member.roles.add(role)
            .then(() => interaction.editReply(`✅ Роль ${role} выдана.`))
            .catch((e) => {
                clientLogger.error(e);
                interaction.editReply("❌ Произошла ошибка.");
            });
};