const { CommandInteraction, Guild } = require("discord.js");
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

module.exports.registerCommands = async (client, shard) => {
    fs.readdir("./src/commands/", (err, files) => {
        if (err) return log.error(err);

        for (let filename of files) {
            let file = require(`../../commands/${filename}`);
            const name = file.name || "";

            if (file.slash && name.length) {
                commands.push({
                    name: name,
                    description: file.description ? file.description : "none",
                    options: file.opts ? file.opts : null,
                });
            };
        };

        client.slashes = commands;

        client.guilds.cache.forEach(async (guild = new Guild()) => {
            await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands }).catch(() => { });
        });
    });
};