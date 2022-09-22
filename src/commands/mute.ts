import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Замьютить участника.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addUserOption((o) => o.setName("member").setDescription("Участник, которому надо выдать мьют.").setRequired(true))
    .addStringOption((o) => o.setName("time").setDescription("Время, на которое участнику надо выдать мьют.").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Причина выдачи мьюта."))
    .toJSON();

import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from "discord.js";
import { clientLogger } from "../util/logger/normal";
import { parseTime } from "../constants/resolvers";
import { inspect } from "util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const member = interaction.options.getMember("member") as GuildMember;
    const timeString = interaction.options.getString("time");
    const reason = interaction.options.getString("reason");

    const time = parseTime(timeString);

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({ content: "❌ У меня нет прав на модерирование участников.", ephemeral: true });
    if (!member.moderatable)
        return interaction.reply({ content: "❌ Я не могу модерировать этого участника.", ephemeral: true });
    if (!time || time > 28 * 24 * 60 * 60 * 1000)
        return interaction.reply({ content: "❌ Некорректное время.", ephemeral: true });
    if (member.roles.highest.rawPosition >= (interaction.member as GuildMember).roles.highest.rawPosition)
        return interaction.reply({ content: "❌ Вы не можете замьютить этого участника.", ephemeral: true });

    let dmsent = false;

    return member.disableCommunicationUntil(Date.now() + time, interaction.user.tag + (reason ? `: ${reason}` : "")).then((m) => {
        interaction.reply({
            content: `✅ ${m.user} был успешно замьючен.` +
                (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : ""),
            allowedMentions: { parse: [] }
        });
    }).catch((e) => {
        clientLogger.error(inspect(e));
        interaction.reply({ content: "❌ Произошла ошибка.", ephemeral: true });
    });
};