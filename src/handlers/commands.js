const { getPermissionLevel } = require("../constants/");
const fs = require("fs");
const { Message } = require("discord.js");

module.exports = async (message = new Message, prefix = String, gdb, db) => {
    let content;
    if (message.content.match(`^<@!?${client.user.id}> `)) content = message.content.split(" ").slice(1);
    else content = message.content.slice(prefix.length).split(" ");
    const commandOrAlias = content.shift().toLowerCase(), commandName = aliases.get(commandOrAlias) || commandOrAlias;
    content = content.join(" ");

    const processCommand = async () => {
        const commandFile = commands.get(commandName);

        const permissionLevel = getPermissionLevel(message.member);
        if (permissionLevel < commandFile.permissionRequired) return message.reply("❌ Недостаточно прав.");

        const args = (content.match(/"[^"]+"|[^ ]+/g) || []).map(arg => arg);
        if (!commandFile.checkArgs(args)) return message.reply("❌ Неверные аргументы.");

        return commandFile.run(message, args, gdb, { prefix, permissionLevel, db })
            .catch(async (e) => {
                log.error(`An error occured while executing ${commandName}: ${e.stack}`);
                const m = await message.reply("❌ Произошла ошибка при исполнении команды. Сообщите разработчику.");

                let additionalInfo;
                if (e.stack.includes("DiscordAPIError: Missing"))
                    additionalInfo = "Изучив логи, удалось узнать, что Боту не хватило прав для удачного выполнения команды.";

                if (additionalInfo) m.edit(m.content + "\n" + additionalInfo);
            });
    };
    await processCommand();
};

// loading commands
const commands = new Map(), aliases = new Map();

fs.readdir("./src/commands/", (err, files) => {
    if (err) return log.error(err);
    for (const file of files) if (file.endsWith(".js") && !require(`../commands/${file}`).slash) loadCommand(file.replace(".js", ""));
});

const loadCommand = fileName => {
    const commandFile = require(`../commands/${fileName}.js`);

    commands.set(fileName, commandFile);
    if (commandFile.aliases) for (const alias of commandFile.aliases) aliases.set(alias, fileName);
};