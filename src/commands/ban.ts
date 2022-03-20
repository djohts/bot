import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Забанить участника.")
    .addUserOption((o) => o.setName("member").setDescription("Пользователь, которого надо забанить.").setRequired(true))
    .addStringOption((o) => o.setName("duration").setDescription("Время, на которое участник будет забанен."))
    .addStringOption((o) => o.setName("reason").setDescription("Причина выдачи бана."))
    .addIntegerOption((o) => o.setName("purgedays").setDescription("Удаление сообщений пользователя за указанное время, в днях.").setMaxValue(7).setMinValue(1))
    .toJSON();
export const permission = 1;

import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import { getPermissionLevel } from "../constants/";
import { parseTime } from "../constants/resolvers";
import prettyms from "pretty-ms";
import db from "../database/";

export async function run(interaction: CommandInteraction) {
    if (!interaction.guild.me.permissions.has("BAN_MEMBERS"))
        return await interaction.reply({ content: "❌ У меня нет прав для выдачи банов.", ephemeral: true });
    if (interaction.options.getString("time") && !parseTime(interaction.options.getString("time")))
        return await interaction.reply({ content: "❌ Не удалось обработать указанное время.", ephemeral: true });

    const bans = await interaction.guild.bans.fetch();
    const guilddb = await db.guild(interaction.guild.id);
    const member = interaction.options.getMember("member") as GuildMember;

    if (bans.has(member.user.id)) return await interaction.reply({ content: "❌ Этот пользователь уже забанен.", ephemeral: true });
    if (getPermissionLevel(member) >= 1)
        return await interaction.reply({ content: "❌ Вы не можете забанить этого человека.", ephemeral: true });

    await interaction.deferReply();

    let dmsent = false;
    let time = 0;
    let reason = interaction.options.getString("reason").trim();
    let purgedays = interaction.options.getInteger("purgedays");
    if (!interaction.options.getString("time")) time = -1;
    else time = Date.now() + parseTime(interaction.options.getString("time"));

    const dmemb = new MessageEmbed()
        .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true })
        })
        .setTitle("Вы были забанены")
        .addField("Модератор", `${interaction.user} (**${interaction.user.tag.replaceAll("*", "\\*")}**)`, true);
    if (time != -1) dmemb.addField("Время", `\`${prettyms(parseTime(interaction.options.getString("time")))}\``, true);
    if (reason) dmemb.addField("Причина", reason);

    await member.user.send({ embeds: [dmemb] }).then(() => dmsent = true).catch(() => false);

    await interaction.guild.bans.create(member.id, {
        reason: `${interaction.user.tag}: ${reason || "Не указана."}`,
        days: purgedays
    }).then(async () => {
        guilddb.setOnObject("bans", member.user.id, time);
        await interaction.editReply({
            content: `✅ ${member} был успешно забанен.` +
                (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : "")
        });
    }).catch(async () => {
        await interaction.editReply({ content: "❌ Произошла неизвестная ошибка." });
    });
};