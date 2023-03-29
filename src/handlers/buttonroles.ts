import { ButtonInteraction, GuildMember, PermissionFlagsBits } from "discord.js";
import { clientLogger } from "../utils/logger/cluster";
import { getGuildDocument } from "../database";
import { inspect } from "node:util";
import i18next from "i18next";

export = async (interaction: ButtonInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT<any, any>(document.locale, null, "handlers.buttonroles");
    const me = await interaction.guild.members.fetchMe();
    const member = interaction.member as GuildMember;

    if (!me.permissions.has(PermissionFlagsBits.ManageRoles))
        return interaction.reply({ content: t("noperm"), ephemeral: true });

    await interaction.deferReply({ ephemeral: true }).catch(() => null);

    const iId = interaction.customId.slice(3);
    const rId = document.brs.get(iId);

    const role = interaction.guild.roles.cache.get(rId ?? "");
    if (!role || (role.rawPosition > me.roles.highest.rawPosition))
        return interaction.editReply(t("role"));

    return member.roles.cache.has(role.id)
        ? member.roles.remove(role)
            .then(() => interaction.editReply(t("removed", { role: `${role}` })))
            .catch((e) => {
                clientLogger.error(inspect(e));
                interaction.editReply(t("error"));
            })
        : member.roles.add(role)
            .then(() => interaction.editReply(t("added", { role: `${role}` })))
            .catch((e) => {
                clientLogger.error(inspect(e));
                interaction.editReply(t("error"));
            });
};