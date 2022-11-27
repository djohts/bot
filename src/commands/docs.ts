import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("docs")
    .setDescription("Bot usage documentation.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import { getGuildDocument } from "../database";
import i18next from "i18next";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT(document.locale, null, "commands.docs");

    return interaction.reply({
        content: t("docs", { link: "<https://djoh.gitbook.io/djoho-bot>" }),
        ephemeral: true
    });
};