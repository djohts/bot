import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Посмотреть задержку бота.")
    .toJSON();
export const permission = 0;

import prettyms from "pretty-ms";
import { ChatInputCommandInteraction } from "discord.js";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const server = Date.now() - interaction.createdTimestamp;
    const uptime = prettyms(interaction.client.uptime);
    const api = interaction.guild.shard.ping;

    await interaction.reply({
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