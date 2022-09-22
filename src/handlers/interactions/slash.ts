import { ChatInputCommandInteraction, ContextMenuCommandInteraction, GuildMember } from "discord.js";
import { clientLogger } from "../../util/logger/normal";
import { getPermissionLevel } from "../../constants/";
import { readdirSync } from "node:fs";
import { inspect } from "util";

export default async (interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction) => {
    const gdb = await interaction.client.util.database.guild(interaction.guildId);
    const _ = interaction.client.util.i18n.getLocale(gdb.get().locale);

    if (gdb.get().channel === interaction.channel.id)
        return interaction.reply({ content: _("handlers.interactions.slash.channel"), ephemeral: true });

    const commandName = interaction.commandName;
    const commandFile = require(`../../commands/${commandName}`);
    const permissionLevel = getPermissionLevel(interaction.member as GuildMember);

    if (permissionLevel < (commandFile.permission ?? 0))
        return interaction.reply({ content: _("handlers.interactions.slash.noperm"), ephemeral: true });

    try {
        await commandFile.run(interaction);
    } catch (e) {
        clientLogger.error(`[g${interaction.guild.id}c${interaction.channel.id}u${interaction.user.id}] ${commandName}: ${inspect(e)}`);

        try {
            if (!interaction.replied) {
                await interaction.reply({ content: _("handlers.interactions.slash.error", { user: `${interaction.user}` }), ephemeral: true });
            } else {
                await interaction.editReply(_("handlers.interactions.slash.error", { user: `${interaction.user}` }));
            };
        } catch {
            await interaction.channel.send(_("handlers.interactions.slash.error", { user: `${interaction.user}` })).catch(() => 0);
        };
    };
};

const commands = [];
export const loadCommands = () => {
    commands.length = 0;

    const files = readdirSync(__dirname + "/../../commands/").filter((x) => x.endsWith(".js"));

    for (let filename of files) {
        let file = require(`../../commands/${filename}`);
        file.options ? commands.push(file.options) : null;
    };

    return commands;
};