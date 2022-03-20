import { Message } from "discord.js";
import { checkMessage } from "stop-discord-phishing";
import countingHandler from "../handlers/counting";
import { linkRates } from "../bot";
import db from "../database/";
import { ModifiedClient } from "../constants/types";
import { deleteMessage } from "../handlers/utils";

export const name = "messageCreate";
export async function run(client: ModifiedClient, message: Message) {
    if (
        !message.guild ||
        message.author.bot ||
        message.channel.type == "DM" ||
        message.channel.name == "dob-flow-editor"
    ) return;

    const gdb = await db.guild(message.guild.id);
    const gsdb = await db.settings(message.guild.id);

    if (gdb.get().mutes.hasOwnProperty(message.author.id) && gsdb.get().delMuted) return deleteMessage(message);

    if (gsdb.get().detectScamLinks && await checkMessage(message.content, true)) {
        let guildRates = linkRates.get(message.guild.id);
        if (!guildRates.has(message.author.id)) {
            await message.channel.send(
                `${message.author}, в вашем сообщении была замечена вредоносная ссылка. Сообщение ` +
                (message.deletable ? "будет удалено." : "не будет удалено, так как у меня нет прав на удаление сообщений в этом канале.")
            ).then((m) => setTimeout(() => deleteMessage(m), 10 * 1000));

            guildRates.add(message.author.id);
            setTimeout(() => guildRates.delete(message.author.id), 5000);
        };
        linkRates.set(message.guild.id, guildRates);

        return deleteMessage(message);
    };

    (global as any).gdb = gdb;
    (global as any).gsdb = gsdb;
    (global as any).gldb = db.global;

    const { channel } = gdb.get();

    if (channel == message.channel.id) return countingHandler(message);
    if (message.content.match(`^<@!?${client.user.id}>`)) return message.react("👋").catch(() => false);
};