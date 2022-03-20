
import { Message, TextChannel } from "discord.js";
const bulks = new Map<string, Message[]>(), rates = new Map<string, number>();

export const deleteMessage = (message: Message) => {
    const rate = rates.get(message.channel?.id) || 0;
    rates.set(message.channel?.id, rate + 1);

    setTimeout(() => rates.set(message.channel?.id, (rates.get(message.channel?.id) || 0) - 1), 10000);

    const bulk = bulks.get(message.channel?.id) || [];
    if (bulk.length) bulk.push(message);
    else if (rate < 3) message.delete().catch(() => null);
    else {
        bulks.set(message.channel?.id, [message]);
        setTimeout(() => {
            (message.channel as TextChannel)?.bulkDelete(bulks.get(message.channel?.id)).catch(() => null);
            bulks.delete(message.channel?.id);
        }, 5000);
    };
};