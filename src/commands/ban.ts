import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Забанить участника.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addUserOption((o) => o.setName("member").setDescription("Пользователь, которого надо забанить.").setRequired(true))
    .addStringOption((o) => o.setName("duration").setDescription("Время, на которое участник будет забанен."))
    .addStringOption((o) => o.setName("reason").setDescription("Причина выдачи бана."))
    .addIntegerOption((o) => o.setName("purgedays").setDescription("Удаление сообщений пользователя за указанное время, в днях.").setMaxValue(7).setMinValue(1))
    .toJSON();

import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, EmbedBuilder } from "discord.js";
import { parseTime } from "../constants/resolvers";
import prettyms from "pretty-ms";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const user = interaction.options.getUser("member");

    if (
        !interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)
    ) return interaction.reply({ content: "❌ У меня нет прав на выдачу банов.", ephemeral: true });
    if (
        interaction.options.getString("duration")
        && !parseTime(interaction.options.getString("duration"))
    ) return interaction.reply({ content: "❌ Не удалось обработать указанное время.", ephemeral: true });

    await interaction.deferReply();

    if (await interaction.guild.bans.fetch(user).catch(() => 0))
        return interaction.editReply("❌ Этот пользователь уже забанен.");
    const member = await interaction.guild.members.fetch(user).catch(() => 0 as 0);

    if (member) {
        if (member.roles.highest.rawPosition >= (interaction.member as GuildMember).roles.highest.rawPosition)
            return interaction.editReply("❌ Вы не можете забанить этого человека.");
        if (
            !member.manageable
        ) return interaction.editReply("❌ Я не могу забанить этого участника.");
    };

    const gdb = await Util.database.guild(interaction.guild.id);
    let dmsent = false;
    let time = 0;
    const reason = interaction.options.getString("reason")?.trim();
    const deleteMessageDays = interaction.options.getInteger("purgedays");
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
    if (time !== -1) dmemb.addFields({
        name: "Время",
        value: `\`${prettyms(parseTime(interaction.options.getString("duration")))}\``,
        inline: true
    });
    if (reason) dmemb.addFields({
        name: "Причина",
        value: reason
    });

    await user.send({ embeds: [dmemb] }).then(() => dmsent = true).catch(() => 0);

    await interaction.guild.bans.create(user, {
        reason: `${interaction.user.tag}: ${reason || "Не указана."}`,
        deleteMessageDays
    }).then(() => {
        if (time !== -1) gdb.setOnObject("bans", user.id, time);
        return interaction.editReply(`✅ ${user} был успешно забанен.` + (dmsent ? "\n[__Пользователь был уведомлён в лс__]" : ""));
    });
};