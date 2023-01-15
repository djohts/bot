import { ChatInputCommandInteraction, ContextMenuCommandInteraction } from "discord.js";
import { clientLogger } from "../../utils/logger/cluster";
import { getGuildDocument } from "../../database";
import { readdirSync } from "node:fs";
import { inspect } from "util";
import i18next from "i18next";

export default async (interaction: ChatInputCommandInteraction<"cached"> | ContextMenuCommandInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    // @ts-ignore
    const t = i18next.getFixedT<any, any>(document.locale, null, "handlers.interactions.slash");

    if (document.counting.channelId === interaction.channelId)
        // @ts-ignore
        return interaction.reply({ content: t("channel"), ephemeral: true });

    const commandName = interaction.commandName;
    const commandFile = await import(`../../commands/${commandName}`);

    try {
        await commandFile.run(interaction);
    } catch (e) {
        clientLogger.error(`[g${interaction.guildId}c${interaction.channel!.id}u${interaction.user.id}] ${commandName}: ${inspect(e)}`);

        try {
            if (!interaction.replied) {
                await interaction.reply({ content: t("error", { user: `${interaction.user}` }), ephemeral: true });
            } else {
                await interaction.editReply(t("error", { user: `${interaction.user}` }));
            };
        } catch {
            await interaction.channel!.send(t("error", { user: `${interaction.user}` })).catch(() => null);
        };
    };
};

const commands: any[] = [];
export const loadCommands = () => {
    commands.length = 0;

    const files = readdirSync(__dirname + "/../../commands/").filter((x) => x.endsWith(".js"));

    for (let filename of files) {
        let file = require(`../../commands/${filename}`);
        file.options ? commands.push(file.options) : null;
    };

    return commands;
};