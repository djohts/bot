const { CommandInteraction, Guild, Client } = require("discord.js");
const { getPermissionLevel } = require("../../constants/");

module.exports = async (interaction = CommandInteraction) => {
    const processCommand = async (interaction = CommandInteraction) => {
        const commandName = interaction.commandName;

        const commandFile = require(`../../commands/${commandName}.js`);

        const permissionLevel = getPermissionLevel(interaction.member);
        if (permissionLevel < commandFile.permissionRequired) return await interaction.reply({ content: "❌ Недостаточно прав.", ephemeral: true });

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
    return fs.readdir(__dirname + "/../../commands/", (err, files) => {
        if (err) return console.error(err);

        for (let filename of files) {
            let file = require(`../../commands/${filename}`);
            const name = file.name || "";

            if (file.slash && name.length) {
                commands.push({
                    name: name,
                    description: file.description || "none",
                    options: file.opts || null,
                });
            };
        };

        client.slashes = commands;

        return Promise.all(client.guilds.cache.map(async (guild = new Guild) => {
            return await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands }).catch((err) => {
                if (!err.message.toLowerCase().includes("missing")) console.error(err);
            });
        }));
    });
};