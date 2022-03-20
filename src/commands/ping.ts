import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Посмотреть задержку бота.")
    .toJSON();
export const permission = 0;

import db from "../database/";
import prettyms from "pretty-ms";
import { CommandInteraction } from "discord.js";

export async function run(interaction: CommandInteraction) {
    const gdb = await db.guild(interaction.guild.id);
    const { channel } = gdb.get();

    await interaction.deferReply({
        ephemeral: interaction.channel.id == channel
    });

    const uptime = prettyms(interaction.client.uptime);
    const api = Math.ceil(interaction.guild.shard.ping);

    return await interaction.editReply({
        embeds: [{
            title: "🏓 Понг!",
            fields: [{
                name: "Сервер",
                value: `\`${Date.now() - interaction.createdTimestamp}ms\``
            }, {
                name: "API",
                value: `\`${api}ms\``
            }, {
                name: "Аптайм",
                value: `\`${uptime}\``
            }]
        }]
    });
};