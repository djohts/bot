import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("docs")
    .setDescription("Bot usage documentation.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import { getGuildDocument } from "../database";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guildId);
    const _ = Util.i18n.getLocale(document.locale);

    return interaction.reply({
        content: _("commands.docs.docs", { link: "<https://djoh.gitbook.io/djoho-bot>" }),
        ephemeral: true
    });
};