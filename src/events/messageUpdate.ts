import { queueDelete } from "../handlers/utils";
import { Message } from "discord.js";
import Util from "../util/Util";

export async function run(original: Message, updated: Message) {
    const gdb = await Util.database.guild(updated.guild.id);

    const { modules, channel, message, count } = gdb.get();
    if (
        channel == updated.channel.id
        && message == updated.id
        && !modules.includes("embed")
        && !modules.includes("webhook")
        && (
            modules.includes("talking")
                ? (original.content || `${count}`).split(/\s/)[0] !== updated.content.split(/\s/)[0]
                : (original.content || `${count}`) !== updated.content
        )
    ) {
        const newMessage = await updated.channel.send(`${updated.author}: ${original.content || count}`);
        gdb.set("message", newMessage.id);
        queueDelete([original]);
    };
};