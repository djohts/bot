import { ChannelType, Message } from "discord.js";
import countingHandler from "../handlers/counting/handler";
import Util from "../util/Util";

export async function run(message: Message) {
    if (
        !message.guild ||
        message.author.bot ||
        message.channel.type === ChannelType.DM ||
        message.channel.name === "dob-flow-editor"
    ) return;

    const gdb = await Util.database.guild(message.guild.id);

    const { channel } = gdb.get();

    if (channel === message.channel.id) return await countingHandler(message);
    if (message.content.match(`^<@!?${Util.client.user.id}>`)) return await message.react("👋").catch(() => null);
};