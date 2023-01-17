import { replies } from "../commands/mention/eval";
import { queueDelete } from "../handlers/utils";
import { getGuildDocument } from "../database";
import { Message } from "discord.js";
import mentionCommands from "../handlers/mentionCommands";

export async function run(original: Message, updated: Message) {
    if (updated.partial) await updated.fetch().catch((e) => {
        if (e.code === 10008) return;
        throw e;
    });
    if (replies.has(updated.id)) return mentionCommands(updated as Message<true>);

    const document = await getGuildDocument(updated.guildId!);

    const { modules, channelId, messageId, count } = document.counting;

    if (
        channelId === updated.channel.id
        && messageId === updated.id
        && !modules.includes("embed")
        && !modules.includes("webhook")
        && (
            modules.includes("talking")
                ? (original.content || `${count}`).split(/\s/)[0] !== updated.content.split(/\s/)[0]
                : (original.content || `${count}`) !== updated.content
        )
    ) {
        const newMessage = await updated.channel.send(`${updated.author}: ${original.content || count}`);
        document.counting.messageId = newMessage.id;
        document.safeSave();
        queueDelete([original]);
    };
};