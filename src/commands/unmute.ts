import { CommandInteraction, GuildMember } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import db from "../database";

export const options = new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Размьютить участника.")
    .addUserOption((o) => o.setName("member").setDescription("Участник, у которого надо снять мьют.").setRequired(true))
    .toJSON();
export const permission = 1;

export async function run(interaction: CommandInteraction) {
    const guilddb = await db.guild(interaction.guild.id);
    const gsdb = await db.settings(interaction.guild.id);
    const role = interaction.guild.roles.cache.get(gsdb.get().muteRole);
    const member = interaction.options.getMember("member");
    const user = interaction.options.getUser("member");

    if (!(member instanceof GuildMember)) return await interaction.reply({
        content: "❌ Участник не найден.",
        fetchReply: true
    });
    if (!role) return interaction.reply({ content: "❌ Не удалось найти роль мьюта.", ephemeral: true });
    if (!interaction.guild.me.permissions.has("MANAGE_ROLES"))
        return interaction.reply({ content: "❌ У меня нет прав для изменения ролей.", ephemeral: true });
    if (interaction.guild.me.roles.cache.sort((a, b) => b.position - a.position).first().rawPosition <= role.rawPosition)
        return interaction.reply({ content: "❌ Роль мьюта находится выше моей.", ephemeral: true });
    if (!member.roles.cache.has(role.id))
        return interaction.reply({ content: "❌ Этот участник не замьючен.", ephemeral: true });

    let dmsent = false;

    member.roles.remove(role).then(() => {
        guilddb.removeFromObject("mutes", member.user.id);
        interaction.reply({
            content: `✅ ${user} был успешно размьючен.` +
                (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : "")
        });
    }).catch((err) => {
        interaction.reply({
            content: "❌ Произошла неизвестная ошибка.",
            ephemeral: true
        });
        console.error(err);
    });
}