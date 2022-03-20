import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("setcount")
    .setDescription("Сменить текущий счёт.")
    .addIntegerOption((o) => o.setName("count").setDescription("Новый счёт.").setRequired(true).setMinValue(0))
    .toJSON();
export const permission = 1;

import { CommandInteraction } from "discord.js";
import db from "../database/";

export async function run(interaction: CommandInteraction) {
    const gdb = await db.guild(interaction.guild.id);
    const count = interaction.options.getInteger("count");

    gdb.set("count", count);

    return interaction.reply({
        content: `✅ Новый текущий счёт - **\`${count}\`**.`,
        ephemeral: (gdb.get().channel == interaction.channel.id)
    });
};