import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Замьютить участника.")
    .addUserOption((o) => o.setName("member").setDescription("Участник, которому надо выдать мьют.").setRequired(true))
    .addStringOption((o) => o.setName("time").setDescription("Время, на которое участнику надо выдать мьют."))
    .addStringOption((o) => o.setName("reason").setDescription("Причина выдачи мьюта."))
    .toJSON();
export const permission = 1;

import { CommandInteraction, GuildMember } from "discord.js";
import { getPermissionLevel } from "../constants/";
import { parseTime } from "../constants/resolvers";
import db from "../database/";

export const run = async (interaction: CommandInteraction): Promise<any> => {
    const guilddb = await db.guild(interaction.guild.id);
    const gsdb = await db.settings(interaction.guild.id);
    const role = interaction.guild.roles.cache.get(gsdb.get().muteRole);
    const member = interaction.options.getMember("member") as GuildMember;

    if (!role) return interaction.reply({ content: "❌ Не удалось найти роль мьюта.", ephemeral: true });
    if (!interaction.guild.me.permissions.has("MANAGE_ROLES"))
        return interaction.reply({ content: "❌ У меня нет прав для изменения ролей.", ephemeral: true });
    if (interaction.guild.me.roles.highest.rawPosition <= role.rawPosition)
        return interaction.reply({ content: "❌ Роль мьюта находится выше моей.", ephemeral: true });
    if (member.user.bot)
        return interaction.reply({ content: "❌ Вы не можете замьютить бота.", ephemeral: true });
    if (getPermissionLevel(member) >= 1)
        return interaction.reply({ content: "❌ Вы не можете замьютить этого участника.", ephemeral: true });
    if (member.roles.cache.has(role.id))
        return interaction.reply({ content: "❌ Этот участник уже замьючен.", ephemeral: true });
    if (interaction.options.getString("time") && !parseTime(interaction.options.getString("time")))
        return interaction.reply({ content: "❌ Не удалось обработать указанное время.", ephemeral: true });

    let dmsent = false;

    let time = 0;
    if (!interaction.options.getString("time")) time = -1;
    else time = Date.now() + parseTime(interaction.options.getString("time"));

    await member.roles.add(role).then(async () => {
        guilddb.setOnObject("mutes", member.user.id, time);
        await interaction.reply({
            content: `✅ ${member.user} был успешно замьючен.` +
                (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : "")
        });
    }).catch(async (err) => {
        console.error(err);
        await interaction.reply({ content: "❌ Произошла ошибка.", ephemeral: true });
    });
};