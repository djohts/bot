import { Message } from "discord.js";
import { ModifiedClient } from "../constants/types";
import db from "../database/";

export const name = "messageDelete";
export async function run(client: ModifiedClient, deleted: Message) {
    const gdb = await db.guild(deleted.guild.id);
    const { modules, channel, message, user, count } = gdb.get();
    if (
        channel == deleted.channel.id &&
        message == deleted.id &&
        !modules.includes("embed") &&
        !modules.includes("webhook")
    ) {
        const newMessage = await deleted.channel.send(`${deleted.author || `<@${user}>`}: ${deleted.content || count}`);
        gdb.set("message", newMessage.id);
    };
};