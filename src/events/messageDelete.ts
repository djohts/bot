import { getGuildDocument } from "../database";
import { Message } from "discord.js";

export async function run(message: Message) {
    if (
        message.client.loading
        || message.author?.bot
    ) return;

    const document = await getGuildDocument(message.guildId!);
    const { modules, channelId, messageId, userId, count } = document.counting;

    if (
        channelId === message.channel.id
        && messageId === message.id
        && !modules.includes("embed")
        && !modules.includes("webhook")
    ) {
        const newMessage = await message.channel.send(`${message.author || `<@${userId}>`}: ${message.content || count}`);
        document.counting.messageId = newMessage.id;
        document.safeSave();
    };
};