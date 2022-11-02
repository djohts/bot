import { ButtonInteraction, GuildMember, PermissionFlagsBits } from "discord.js";
import { clientLogger } from "../util/logger/cluster";
import { getGuildDocument } from "../database";
import Util from "../util/Util";

export = async (interaction: ButtonInteraction) => {
    const document = await getGuildDocument(interaction.guildId);
    const _ = Util.i18n.getLocale(document.locale);
    const member = interaction.member as GuildMember;
    const guild = interaction.guild;

    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles))
        return interaction.reply({ content: _("handlers.buttonroles.noperm"), ephemeral: true });

    await interaction.deferReply({ ephemeral: true }).catch(() => null);

    const iId = interaction.customId.slice(3);
    const rId = document.brs.get(iId);

    const role = interaction.guild.roles.cache.get(rId);
    if (!role || (role.rawPosition > interaction.guild.members.me.roles.highest.rawPosition))
        return interaction.editReply(_("handlers.buttonroles.role"));

    return member.roles.cache.has(role.id)
        ? member.roles.remove(role)
            .then(() => interaction.editReply(_("handlers.buttonroles.removed", { role: `${role}` })))
            .catch((e) => {
                clientLogger.error(e);
                interaction.editReply(_("handlers.buttonroles.error"));
            })
        : member.roles.add(role)
            .then(() => interaction.editReply(_("handlers.buttonroles.added", { role: `${role}` })))
            .catch((e) => {
                clientLogger.error(e);
                interaction.editReply(_("handlers.buttonroles.error"));
            });
};