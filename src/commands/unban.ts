import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addUserOption((o) => o.setName("user").setDescription("User.").setRequired(true))
    .toJSON();

import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { getGuildDocument } from "../database";
import i18next from "i18next";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guild.id);
    const t = i18next.getFixedT(document.locale, null, "commands.unban");

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
        return interaction.reply({ content: t("noperm"), ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser("user");

    if (!(await interaction.guild.bans.fetch(user).catch(() => 0)))
        return interaction.editReply(t("noban"))
            .then(() => {
                document.bans.delete(user.id);
                document.safeSave();
            });

    return interaction.guild.bans.remove(user.id).then(() => {
        document.bans.delete(user.id);
        document.safeSave();

        return interaction.editReply(t("done"));
    });
};