"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = void 0;
const constants_1 = require("../../constants/");
exports.default = async (interaction) => {
    const processCommand = async (interaction) => {
        const commandName = interaction.commandName;
        const commandFile = require(`../../commands/${commandName}`);
        const permissionLevel = (0, constants_1.getPermissionLevel)(interaction.member);
        if (permissionLevel < commandFile.permission)
            return await interaction.reply({ content: "❌ Недостаточно прав.", ephemeral: true });
        return commandFile.run(interaction);
    };
    await processCommand(interaction);
};
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../../../config"));
const commands = [];
const rest = new rest_1.REST({ version: "9" }).setToken(config_1.default.token);
const registerCommands = async (client) => {
    const files = fs_1.default.readdirSync(__dirname + "/../../commands/");
    for (let filename of files) {
        let file = require(`../../commands/${filename}`);
        file.options ? commands.push(file.options) : null;
    }
    ;
    client.slashes = commands;
    await Promise.all(client.guilds.cache.map(async (guild) => {
        return await rest.put(v9_1.Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands }).catch((err) => {
            if (!err.message.toLowerCase().includes("missing"))
                console.error(err);
        });
    }));
};
exports.registerCommands = registerCommands;
