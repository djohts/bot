import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Посмотреть задержку бота.")
    .setDMPermission(false)
    .toJSON();

import prettyms from "pretty-ms";
import { ChatInputCommandInteraction } from "discord.js";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const then = Date.now();

    await interaction.deferReply();

    const server = Date.now() - then;
    const uptime = prettyms(interaction.client.uptime);
    const api = interaction.guild.shard.ping;

    return interaction.editReply({
        embeds: [{
            title: "🏓 Понг!",
            description: [
                "```",
                `Сервер   :: ${server}ms`,
                `API      :: ${api}ms`,
                `Аптайм   :: ${uptime}`,
                "```"
            ].join("\n")
        }]
    });
};