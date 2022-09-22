import { GuildTextBasedChannel, Message, PermissionFlagsBits } from "discord.js";

const bulks = new Map<string, Message[]>();
export function queueDelete(messages: Message[]): void {
    if (!messages.length) return;
    const channel = messages[0]!.channel as GuildTextBasedChannel;

    const bulk = bulks.get(channel.id);
    if (!bulk && messages.length === 1) {
        void messages[0]?.delete().catch(() => null);
        bulks.set(channel.id, []);
    } else if (bulk) return void bulk.push(...messages);
    else bulks.set(channel.id, messages);

    return void setTimeout(() => void bulkDelete(channel), 3100);
};

async function bulkDelete(channel: GuildTextBasedChannel): Promise<void> {
    const me = await channel.guild.members.fetchMe();
    if (
        !channel.permissionsFor(me).has(PermissionFlagsBits.ViewChannel)
        || !channel.permissionsFor(me).has(PermissionFlagsBits.ReadMessageHistory)
        || !channel.permissionsFor(me).has(PermissionFlagsBits.ManageMessages)
    ) return void bulks.delete(channel.id);

    const bulk = bulks.get(channel.id);
    if (!bulk?.length) return void bulks.delete(channel.id);

    if (bulk.length > 1) void channel.bulkDelete(bulk.slice(0, 100)).catch(() => null);
    else void bulk[0]!.delete().catch(() => null);

    const newBulk = bulk.slice(100);
    if (!newBulk.length) return void bulks.delete(channel.id);

    bulks.set(channel.id, newBulk);
    return void setTimeout(() => void bulkDelete(channel), 3100);
};