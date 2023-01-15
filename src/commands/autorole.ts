import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Automatically add role(s) upon member join.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addSubcommand((c) =>
        c.setName("add").setDescription("Add a role that will be added upon member join.")
            .addRoleOption((o) => o.setName("role").setDescription("A role that will be given.").setRequired(true))
    )
    .addSubcommand((c) =>
        c.setName("list").setDescription("Add a role that will be added upon member join.")
    )
    .addSubcommand((c) =>
        c.setName("remove").setDescription("Add a role that will be added upon member join.")
            .addStringOption((o) => o.setName("role").setDescription("Role ID.").setRequired(true).setAutocomplete(true))
    )
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import { AutoroleMode } from "../database/models/Guild";
import { getGuildDocument } from "../database";
import i18next from "i18next";
import limits from "../constants/limits";
import dedent from "dedent";

export const run = async (interaction: ChatInputCommandInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT<any, any>(document.locale, null, "commands.autorole");

    switch (interaction.options.getSubcommand(true)) {
        case "add":
            if (document.autoroles.size >= limits.MAX_AUTOROLES)
                return interaction.reply({ content: t("add.limit"), ephemeral: true });

            const role = interaction.options.getRole("role", true);

            if (
                role.managed
                || interaction.guildId === role.id
            )
                return interaction.reply({ content: t("add.managed"), ephemeral: true });

            const me = await interaction.guild.members.fetchMe();

            if (!me.permissions.has(PermissionFlagsBits.ManageRoles))
                return interaction.reply({ content: t("add.noperm"), ephemeral: true });
            if (me.roles.highest.comparePositionTo(role) < 1)
                return interaction.reply({ content: t("add.rolepos"), ephemeral: true });

            document.autoroles.set(role.id, {
                id: role.id,
                mode: AutoroleMode.User,
                createdTimestamp: Date.now(),
                createdBy: interaction.user.id
            });
            document.safeSave();

            return interaction.reply({
                content: t("add.done", { role: `${role}` }),
                allowedMentions: { parse: [] }
            });
        case "list":
            const embed = new EmbedBuilder().setTitle(t("list.title"));

            const mapped = Array.from(document.autoroles.values()).map((dbRole) => {
                const timestamp = Math.round(dbRole.createdTimestamp / 1000);

                return dedent`
                    > <@&${dbRole.id}> (\`${dbRole.id}\`)
                        - ${t("list.createdby", { user: `<@${dbRole.createdBy}>` })}
                        - ${t("list.createdat", { absolute: `<t:${timestamp}:f>`, relative: `<t:${timestamp}:R>` })}
                `;
            });

            embed.setDescription(mapped.join("\n") || t("list.empty"));

            return interaction.reply({ embeds: [embed] });
        case "remove":
            const roleId = interaction.options.getString("role", true);

            document.autoroles.delete(roleId);
            document.safeSave();

            return interaction.reply(t("remove.done"));
    };
};