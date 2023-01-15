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
import i18next from "i18next";

export const run = async (interaction: ChatInputCommandInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT<any, any>(document.locale, null, "commands.setcount");
    const count = interaction.options.getInteger("count", true);

    document.counting.count = count;
    document.safeSave();

    return interaction.reply(t("done", { count: count }));
};