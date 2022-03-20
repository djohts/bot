import { CommandInteraction, GuildMember } from "discord.js";
import { getPermissionLevel } from "../../constants/";

export default async (interaction: CommandInteraction) => {
    const processCommand = async (interaction: CommandInteraction) => {
        const commandName = interaction.commandName;

        const commandFile = require(`../../commands/${commandName}`);

        const permissionLevel = getPermissionLevel(interaction.member as GuildMember);
        if (permissionLevel < commandFile.permission) return await interaction.reply({ content: "❌ Недостаточно прав.", ephemeral: true });

        return commandFile.run(interaction);
    };
    await processCommand(interaction);
};

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import fs from "fs";
import { ModifiedClient } from "../../constants/types";
import config from "../../../config";
const commands = [];
const rest = new REST({ version: "9" }).setToken(config.token);

export const registerCommands = async (client: ModifiedClient) => {
    const files = fs.readdirSync(__dirname + "/../../commands/");

    for (let filename of files) {
        let file = require(`../../commands/${filename}`);

        file.options ? commands.push(file.options) : null;
    };

    client.slashes = commands;

    await Promise.all(client.guilds.cache.map(async (guild) => {
        return await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands }).catch((err) => {
            if (!err.message.toLowerCase().includes("missing")) console.error(err);
        });
    }));
};