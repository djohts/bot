import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("setcount")
    .setDescription("Сменить текущий счёт.")
    .addIntegerOption((o) => o.setName("count").setDescription("Новый счёт.").setRequired(true).setMinValue(0))
    .toJSON();
export const permission = 1;

import { CommandInteraction } from "discord.js";
import db from "../database/";

export const run = async (interaction: CommandInteraction): Promise<any> => {
    const gdb = await db.guild(interaction.guild.id);
    const count = interaction.options.getInteger("count");

    gdb.set("count", count);

    await interaction.reply({ content: `✅ Новый текущий счёт - **\`${count}\`**.` });
};