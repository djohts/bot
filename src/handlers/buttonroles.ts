import { ButtonInteraction, GuildMember, PermissionFlagsBits } from "discord.js";
import { clientLogger } from "../util/logger/cluster";
import { getGuildDocument } from "../database";
import i18next from "i18next";

export = async (interaction: ButtonInteraction) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT(document.locale, null, "handlers.buttonroles");
    const member = interaction.member as GuildMember;
    const guild = interaction.guild;

    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles))
        return interaction.reply({ content: t("noperm"), ephemeral: true });

    await interaction.deferReply({ ephemeral: true }).catch(() => null);

    const iId = interaction.customId.slice(3);
    const rId = document.brs.get(iId);

    const role = interaction.guild.roles.cache.get(rId);
    if (!role || (role.rawPosition > interaction.guild.members.me.roles.highest.rawPosition))
        return interaction.editReply(t("role"));

    return member.roles.cache.has(role.id)
        ? member.roles.remove(role)
            .then(() => interaction.editReply(t("removed", { role: `${role}` })))
            .catch((e) => {
                clientLogger.error(e);
                interaction.editReply(t("error"));
            })
        : member.roles.add(role)
            .then(() => interaction.editReply(t("added", { role: `${role}` })))
            .catch((e) => {
                clientLogger.error(e);
                interaction.editReply(t("error"));
            });
};