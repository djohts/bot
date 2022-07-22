import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Размьютить участника.")
    .addUserOption((o) => o.setName("member").setDescription("Участник которому надо снять мьют.").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Причина снятия мьюта."))
    .toJSON();
export const permission = 1;

import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from "discord.js";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const member = interaction.options.getMember("member") as GuildMember;
    const reason = interaction.options.getString("reason");

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers))
        return await interaction.reply({ content: "❌ У меня нет прав на модерирование участников.", ephemeral: true });
    if (!member.moderatable)
        return await interaction.reply({ content: "❌ Я не могу модерировать этого участника.", ephemeral: true });
    if (member.communicationDisabledUntil.getTime() < Date.now())
        return await interaction.reply({ content: "❌ Этот участник не замьючен.", ephemeral: true });

    let dmsent = false;

    await member.disableCommunicationUntil(0, interaction.user.tag + (reason ? `: ${reason}` : "")).then(async () => {
        await interaction.reply({
            content: `✅ ${member} был успешно размьючен.` +
                (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : ""),
            allowedMentions: { parse: [] }
        });
    }).catch(async (err) => {
        console.error(err);
        await interaction.reply({ content: "❌ Произошла ошибка.", ephemeral: true });
    });
};