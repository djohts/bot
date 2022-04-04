import { CommandInteraction, GuildMember } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import db from "../database";

export const options = new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Размьютить участника.")
    .addUserOption((o) => o.setName("member").setDescription("Участник, у которого надо снять мьют.").setRequired(true))
    .toJSON();
export const permission = 1;

export const run = async (interaction: CommandInteraction): Promise<any> => {
    const guilddb = await db.guild(interaction.guild.id);
    const gsdb = await db.settings(interaction.guild.id);
    const role = interaction.guild.roles.cache.get(gsdb.get().muteRole);
    const member = interaction.options.getMember("member") as GuildMember;
    const user = interaction.options.getUser("member");

    if (!role)
        return await interaction.reply({
            content: "❌ Не удалось найти роль мьюта.",
            ephemeral: true
        });
    if (!interaction.guild.me.permissions.has("MANAGE_ROLES") || !member.manageable)
        return await interaction.reply({
            content: "❌ У меня нет прав на изменение ролей.",
            ephemeral: true
        });
    if (interaction.guild.me.roles.highest.rawPosition <= role.rawPosition)
        return await interaction.reply({
            content: "❌ Роль мьюта находится выше моей.",
            ephemeral: true
        });
    if (!member.roles.cache.has(role.id))
        return await interaction.reply({
            content: "❌ Этот участник не замьючен.",
            ephemeral: true
        });

    let dmsent = false;

    await member.roles.remove(role).then(async () => {
        guilddb.removeFromObject("mutes", member.user.id);
        await interaction.reply({
            content: `✅ ${user} был успешно размьючен.` +
                (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : "")
        });
    }).catch(async (err) => {
        console.error(err);
        await interaction.reply({
            content: "❌ Произошла ошибка.",
            ephemeral: true
        });
    });
}