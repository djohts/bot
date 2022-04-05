import { deleteMessage } from "../handlers/utils";
import { Message } from "discord.js";
import Util from "../util/Util";

export const name = "messageUpdate";
export async function run(original: Message, updated: Message) {
    const gdb = await Util.database.guild(updated.guild.id);

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
};