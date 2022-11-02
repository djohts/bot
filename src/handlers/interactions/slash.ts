import { ChatInputCommandInteraction, ContextMenuCommandInteraction } from "discord.js";
import { clientLogger } from "../../util/logger/cluster";
import { getGuildDocument } from "../../database";
import { readdirSync } from "node:fs";
import { inspect } from "util";

export default async (interaction: ChatInputCommandInteraction<"cached"> | ContextMenuCommandInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    const _ = interaction.client.util.i18n.getLocale(document.locale);

    if (document.counting.channelId === interaction.channelId)
        return interaction.reply({ content: _("handlers.interactions.slash.channel"), ephemeral: true });

    const commandName = interaction.commandName;
    const commandFile = await import(`../../commands/${commandName}`);

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
            await interaction.channel.send(_("handlers.interactions.slash.error", { user: `${interaction.user}` })).catch(() => null);
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