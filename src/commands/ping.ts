import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Посмотреть задержку бота.")
    .toJSON();
export const permission = 0;

import db from "../database/";
import prettyms from "pretty-ms";
import { CommandInteraction } from "discord.js";
import { model } from "mongoose";

export async function run(interaction: CommandInteraction) {
    const gdb = await db.guild(interaction.guild.id);
    const { channel } = gdb.get();

    const server = Date.now() - interaction.createdTimestamp;
    const uptime = prettyms(interaction.client.uptime);
    const api = Math.ceil(interaction.guild.shard.ping);

    let a = Date.now();
    await model("Guild").find();
    const dbping = Date.now() - a;

    await interaction.reply({
        embeds: [{
            title: "🏓 Понг!",
            description: [
                "```",
                `Сервер   :: ${server}ms`,
                `API      :: ${api}ms`,
                `DB       :: ${dbping}ms`,
                `Аптайм   :: ${uptime}`,
                "```"
            ].join("\n")
        }],
        ephemeral: interaction.channel.id == channel
    });
};