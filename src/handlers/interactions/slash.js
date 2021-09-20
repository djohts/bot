const { CommandInteraction, Guild } = require("discord.js");
const { getPermissionLevel } = require("../../constants/");
const config = require("../../../config");
const fs = require("fs");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [];
const rest = new REST({ version: '9' }).setToken(config.token);

module.exports = async (client, shard) => {
    client.on("interactionCreate", async (interaction = new CommandInteraction) => {
        const processCommand = async () => {
            const commandName = interaction.commandName;

            const commandFile = require(`../../commands/${commandName}.js`);

            const permissionLevel = getPermissionLevel(interaction.member);
            if (permissionLevel < commandFile.permissionRequired) return await interaction.reply({ content: "❌ Недостаточно прав.", ephemeral: true });

            return commandFile.run(interaction)
                .catch(async (e) => {
                    log.error(`An error occured while executing ${commandName}: ${e.stack}`);
                    await interaction.reply("❌ Произошла ошибка при исполнении команды. Сообщите разработчику.");
                });
        };
        await processCommand();
    });

    fs.readdir("./src/commands/", (err, files) => {
        if (err) return log.error(err);

        for (let name of files) {
            name = name.replace(".js", "");
            let file = require(`../../commands/${name}.js`);

            if (file.slash) {
                commands.push({ name: name, description: file.description ? file.description : "none" });
            };
        };

        client.guilds.cache.forEach(async (guild = new Guild) => {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guild.id),
                { body: commands },
            );
        });

        log.log(`${shard} Refreshed slash commands.`);
    });
};