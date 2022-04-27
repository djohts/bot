import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Замьютить участника.")
    .addUserOption((o) => o.setName("member").setDescription("Участник, которому надо выдать мьют.").setRequired(true))
    .addStringOption((o) => o.setName("time").setDescription("Время, на которое участнику надо выдать мьют.").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Причина выдачи мьюта."))
    .toJSON();
export const permission = 1;

import { CommandInteraction, GuildMember } from "discord.js";
import { getPermissionLevel } from "../constants/";
import { parseTime } from "../constants/resolvers";

export const run = async (interaction: CommandInteraction): Promise<any> => {
    const member = interaction.options.getMember("member") as GuildMember;
    const timeString = interaction.options.getString("time");
    const reason = interaction.options.getString("reason");

    const time = parseTime(timeString);

    if (!interaction.guild.me.permissions.has("MODERATE_MEMBERS"))
        return await interaction.reply({ content: "❌ У меня нет прав на модерирование участников.", ephemeral: true });
    if (!member.moderatable)
        return await interaction.reply({ content: "❌ Я не могу модерировать этого участника.", ephemeral: true });
    if (!time || time > 28 * 24 * 60 * 60 * 1000)
        return await interaction.reply({ content: "❌ Некорректное время.", ephemeral: true });
    if (getPermissionLevel(member) >= getPermissionLevel(interaction.member as GuildMember))
        return await interaction.reply({ content: "❌ Вы не можете замьютить этого участника.", ephemeral: true });

    let dmsent = false;

    await member.disableCommunicationUntil(Date.now() + time, interaction.user.tag + (reason ? `: ${reason}` : "")).then(async (m) => {
        await interaction.reply({
            content: `✅ ${m.user} был успешно замьючен.` +
                (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : ""),
            allowedMentions: { parse: [] }
        });
    }).catch(async (e) => {
        console.error(e);
        await interaction.reply({ content: "❌ Произошла ошибка.", ephemeral: true });
    });
};