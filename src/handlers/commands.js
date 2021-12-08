const { getPermissionLevel } = require("../constants/");
const fs = require("fs");
const { Message } = require("discord.js");

module.exports = async (message, prefix, gdb, db) => {
    if (!(message instanceof Message)) return;

    let content;
    if (message.content.match(`^<@!?${client.user.id}> `)) content = message.content.split(/\s+/).slice(1);
    else content = message.content.slice(prefix.length).split(/\s+/);
    const commandOrAlias = content.shift().toLowerCase(),
        commandName = aliases.get(commandOrAlias) || commandOrAlias;
    content = content.join(" ");

    const processCommand = async () => {
        const commandFile = commands.get(commandName);
        if (!commandFile) return;

        if (!require("../../config").admins.includes(message.author.id)) return;

        const args = (content.match(/"[^"]+"|[^ ]+/g) || []).map((arg) => arg);
        if (!commandFile.checkArgs(args)) return message.reply("❌ Неверные аргументы.");

        return commandFile.run(message, args);
    };
    await processCommand();
};

const commands = new Map(), aliases = new Map();

fs.readdir(__dirname + "/../commands/", (err, files) => {
    if (err) return console.error(err);
    for (const file of files) if (file.endsWith(".js") && !require(`../commands/${file}`).slash) loadCommand(file.replace(".js", ""));
});

const loadCommand = (fileName) => {
    const commandFile = require(`../commands/${fileName}.js`);

    commands.set(fileName, commandFile);
    if (commandFile.aliases) for (const alias of commandFile.aliases) aliases.set(alias, fileName);
};