import { CommandInteraction, GuildMember } from "discord.js";
import { getPermissionLevel } from "../../constants/";
import db from "../../database/";

export default async (interaction: CommandInteraction) => {
    const gdb = await db.guild(interaction.guild.id);
    if (gdb.get().channel === interaction.channel.id)
        return await interaction.reply({ content: "❌ Команды недоступны в этом канале", ephemeral: true });

    const commandName = interaction.commandName;
    const commandFile = require(`../../commands/${commandName}`);
    const permissionLevel = getPermissionLevel(interaction.member as GuildMember);
    if (permissionLevel < commandFile.permission)
        return await interaction.reply({ content: "❌ Недостаточно прав.", ephemeral: true });

    try {
        commandFile.run(interaction);
    } catch (e) {
        console.error(`Error in ${commandName}:`, e);
    };
};

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import fs from "fs";
import { ModifiedClient, SlashCommand } from "../../constants/types";
import config from "../../../config";
export const commands: SlashCommand[] = [];
const registeredGuilds: string[] = [];
const rest = new REST({ version: "9" }).setToken(config.token);

export const registerCommands = async (client: ModifiedClient) => {
    const files = fs.readdirSync(__dirname + "/../../commands/");

    for (let filename of files) {
        let file = require(`../../commands/${filename}`);

        file.options ? commands.push(file.options) : null;
    };

    await Promise.all(client.guilds.cache.map(async (guild) => {
        await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands })
            .then(() => registeredGuilds.push(guild.id))
            .catch((err) => {
                if (!err.message.toLowerCase().includes("missing")) console.error(err);
            });
    }));

    return registeredGuilds;
};