const { Client } = require("discord.js");
const handleButton = require("./buttons");
const handleCommand = require("./slash");

module.exports = async (client = new Client) => {
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.guild) return;
        if (interaction.isButton()) return handleButton(interaction);
        if (interaction.isCommand()) return handleCommand(interaction);
    });
};