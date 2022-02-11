const { CommandInteraction, Client } = require("discord.js");
const { getPermissionLevel } = require("../../constants/");

module.exports = async (interaction = CommandInteraction) => {
    if (!(interaction instanceof CommandInteraction)) return;
    const processCommand = async (interaction = CommandInteraction) => {
        if (!(interaction instanceof CommandInteraction)) return;
        const commandName = interaction.commandName;

        const commandFile = require(`../../commands/${commandName}.js`);

        const permissionLevel = getPermissionLevel(interaction.member);
        if (permissionLevel < commandFile.permission) return await interaction.reply({ content: "❌ Недостаточно прав.", ephemeral: true });

        return commandFile.run(interaction);
    };
    await processCommand(interaction);
};

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");
const commands = [];
const rest = new REST({ version: "9" }).setToken(require("../../../config").token);

module.exports.registerCommands = async (client = new Client) => {
    const files = fs.readdirSync(__dirname + "/../../commands/");

    for (let filename of files) {
        let file = require(`../../commands/${filename}`);

        file.options ? commands.push(file.options) : "";
    };

    client.slashes = commands;

    await Promise.all(client.guilds.cache.map(async (guild) => {
        return await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands }).catch((err) => {
            if (!err.message.toLowerCase().includes("missing")) console.error(err);
        });
    }));
};