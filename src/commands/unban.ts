import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import db from "../database";

export const options = new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Разбанить участника.")
    .addUserOption((o) => o.setName("user").setDescription("Пользователь, которого надо разбанить.").setRequired(true))
    .toJSON();
export const permission = 1;

export async function run(interaction: CommandInteraction) {
    if (!interaction.guild.me.permissions.has("BAN_MEMBERS"))
        return interaction.reply({ content: "❌ У меня нет прав для просмотра списка / снятия банов.", ephemeral: true });

    const bans = await interaction.guild.bans.fetch();
    const gdb = await db.guild(interaction.guild.id);
    const user = interaction.options.getUser("user");

    if (!bans.has(user.id))
        return await interaction.reply({ content: "❌ Этот участник не забанен.", ephemeral: true })
            .then(() => gdb.removeFromObject("bans", user.id));

    interaction.guild.bans.remove(user.id).then(async () => {
        gdb.removeFromObject("bans", user.id);
        await interaction.reply({ content: "✅ Юзер был успешно разбанен.", ephemeral: true });
    });
};