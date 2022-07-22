import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Забанить участника.")
    .addUserOption((o) => o.setName("member").setDescription("Пользователь, которого надо забанить.").setRequired(true))
    .addStringOption((o) => o.setName("duration").setDescription("Время, на которое участник будет забанен."))
    .addStringOption((o) => o.setName("reason").setDescription("Причина выдачи бана."))
    .addIntegerOption((o) => o.setName("purgedays").setDescription("Удаление сообщений пользователя за указанное время, в днях.").setMaxValue(7).setMinValue(1))
    .toJSON();
export const permission = 1;

import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, EmbedBuilder } from "discord.js";
import { getPermissionLevel } from "../constants/";
import { parseTime } from "../constants/resolvers";
import prettyms from "pretty-ms";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const member = interaction.options.getMember("member") as GuildMember;

    if (
        !interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers) ||
        !member.manageable
    ) return await interaction.reply({ content: "❌ Я не могу забанить этого участника.", ephemeral: true });
    if (
        interaction.options.get("duration") as unknown as string &&
        !parseTime(interaction.options.get("duration") as unknown as string)
    ) return await interaction.reply({ content: "❌ Не удалось обработать указанное время.", ephemeral: true });

    const bans = await interaction.guild.bans.fetch();
    const guilddb = await Util.database.guild(interaction.guild.id);

    if (bans.has(member.user.id))
        return await interaction.reply({ content: "❌ Этот пользователь уже забанен.", ephemeral: true });
    if (getPermissionLevel(member) >= getPermissionLevel(interaction.member as GuildMember))
        return await interaction.reply({ content: "❌ Вы не можете забанить этого человека.", ephemeral: true });

    await interaction.deferReply();

    let dmsent = false;
    let time = 0;
    let reason = interaction.options.getString("reason")?.trim();
    let purgedays = interaction.options.getInteger("purgedays");
    if (!interaction.options.getString("duration")) time = -1;
    else time = Date.now() + parseTime(interaction.options.getString("duration"));

    const dmemb = new EmbedBuilder()
        .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL()
        })
        .setTitle("Вы были забанены")
        .addFields({
            name: "Модератор",
            value: `${interaction.user} (**${interaction.user.tag.replace(/\*/g, "\\*")}**)`,
            inline: true
        });
    if (time != -1) dmemb.addFields({
        name: "Время",
        value: `\`${prettyms(parseTime(interaction.options.getString("duration")))}\``,
        inline: true
    });
    if (reason) dmemb.addFields({
        name: "Причина",
        value: reason
    });

    await member.user.send({ embeds: [dmemb] }).then(() => dmsent = true).catch(() => null);

    await interaction.guild.bans.create(member.id, {
        reason: `${interaction.user.tag}: ${reason || "Не указана."}`,
        deleteMessageDays: purgedays
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
