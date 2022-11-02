import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("setcount")
    .setDescription("Set current count.")
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
    .addIntegerOption((o) => o.setName("count").setDescription("New count.").setRequired(true).setMinValue(0))
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import { getGuildDocument } from "../database";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const document = await getGuildDocument(interaction.guild.id);
    const _ = Util.i18n.getLocale(document.locale);
    const count = interaction.options.getInteger("count");

    document.counting.count = count;
    document.safeSave();

    return interaction.reply(_("commands.setcount.done", { count: `${count}` }));
};