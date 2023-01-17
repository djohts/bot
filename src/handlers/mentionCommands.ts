import { Message } from "discord.js";

export default function (message: Message<true>) {
    const [command, ...args] = message.content.slice(`<@${message.client.user.id}>`.length).trim().split(" ");

    let commandFile;
    try {
        commandFile = require(`../commands/mention/${command}`);
    } catch { };
    if (!commandFile) return;

    commandFile.run(message, args);
};