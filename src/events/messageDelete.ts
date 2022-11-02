import { getGuildDocument } from "../database";
import { Message } from "discord.js";

export async function run(deleted: Message) {
    const document = await getGuildDocument(deleted.guild.id);
    const { modules, channelId, messageId, userId, count } = document.counting;
    if (
        channelId === deleted.channel.id
        && messageId === deleted.id
        && !modules.includes("embed")
        && !modules.includes("webhook")
    ) {
        const newMessage = await deleted.channel.send(`${deleted.author || `<@${userId}>`}: ${deleted.content || count}`);
        document.counting.messageId = newMessage.id;
        document.safeSave();
    };
};