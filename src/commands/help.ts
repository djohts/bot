import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("help")
    .setDescription("List bot commands.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { loadCommands } from "../handlers/interactions/slash";
import { getGuildDocument } from "../database";
import i18next from "i18next";

export const run = async (interaction: ChatInputCommandInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT<any, any>(document.locale, null, "commands.help");

    const commands = (loadCommands() as RESTPostAPIChatInputApplicationCommandsJSONBody[])
        .filter((x) => x.name !== "help" && x.name !== "unwtf"); // TODO: Remove this when we have a better way to hide commands
    const mapped = commands.map((x) => `\`/${x.name}\` - **${x.description}**`)

    return interaction.reply({
        embeds: [{
            title: t("title"),
            description: mapped.join("\n")
        }]
    });
};