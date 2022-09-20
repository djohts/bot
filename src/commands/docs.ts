import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("docs")
    .setDescription("Документация по использованию бота.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guildId);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    return interaction.reply({
        content: _("commands.docs.docs", { link: "https://djoh.gitbook.io/djoho-bot" }),
        ephemeral: true
    });
};