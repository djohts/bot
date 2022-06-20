import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Разбанить участника.")
    .addUserOption((o) => o.setName("user").setDescription("Пользователь, которого надо разбанить.").setRequired(true))
    .toJSON();
export const permission = 1;

import { CommandInteraction } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: CommandInteraction) => {
    if (!interaction.guild.me.permissions.has("BAN_MEMBERS"))
        return await interaction.reply({ content: "❌ У меня нет прав для просмотра списка / снятия банов.", ephemeral: true });

    const bans = await interaction.guild.bans.fetch();
    const gdb = await Util.database.guild(interaction.guild.id);
    const user = interaction.options.getUser("user");

    if (!bans.has(user.id))
        return await interaction.reply({ content: "❌ Этот участник не забанен.", ephemeral: true })
            .then(() => gdb.removeFromObject("bans", user.id));

    await interaction.guild.bans.remove(user.id).then(async () => {
        gdb.removeFromObject("bans", user.id);
        await interaction.reply({ content: "✅ Юзер был успешно разбанен.", ephemeral: true });
    });
};