import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Разбанить участника.")
    .addUserOption((o) => o.setName("user").setDescription("Пользователь, которого надо разбанить.").setRequired(true))
    .toJSON();
export const permission = 1;

import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
        return await interaction.reply({ content: "❌ У меня нет прав для просмотра списка / снятия банов.", ephemeral: true });

    const gdb = await Util.database.guild(interaction.guild.id);
    const user = interaction.options.getUser("user");

    if (!(await interaction.guild.bans.fetch(user).catch(() => 0)))
        return await interaction.reply({ content: "❌ Этот участник не забанен.", ephemeral: true })
            .then(() => gdb.removeFromObject("bans", user.id));

    await interaction.guild.bans.remove(user.id).then(async () => {
        gdb.removeFromObject("bans", user.id);
        await interaction.reply({ content: "✅ Юзер был успешно разбанен.", ephemeral: true });
    });
};