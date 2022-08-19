import { Message } from "discord.js";
import Util from "../util/Util";

export async function run(deleted: Message) {
    const gdb = await Util.database.guild(deleted.guild.id);
    const { modules, channel, message, user, count } = gdb.get();
    if (
        channel === deleted.channel.id
        && message === deleted.id
        && !modules.includes("embed")
        && !modules.includes("webhook")
    ) {
        const newMessage = await deleted.channel.send(`${deleted.author || `<@${user}>`}: ${deleted.content || count}`);
        gdb.set("message", newMessage.id);
    };
};