import { Message } from "discord.js";
import { deleteMessage } from "../handlers/utils";
import db from "../database";
import { ModifiedClient } from "../constants/types";

export const name = "messageUpdate";
export async function run(client: ModifiedClient, original: Message, updated: Message) {
    const gdb = await db.guild(updated.guild.id);

    const { modules, channel, message, count } = gdb.get();
    if (channel == updated.channel.id &&
        message == updated.id &&
        !modules.includes("embed") &&
        !modules.includes("webhook") &&
        (
            modules.includes("talking")
                ? (original.content || `${count}`).split(" ")[0] != updated.content.split(" ")[0]
                : (original.content || `${count}`) != updated.content
        )) {
        const newMessage = await updated.channel.send(`${updated.author}: ${original.content || count}`);
        gdb.set("message", newMessage.id);
        deleteMessage(original);
    };
}