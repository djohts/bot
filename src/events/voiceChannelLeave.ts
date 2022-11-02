import { GuildMember, VoiceBasedChannel } from "discord.js";
import { getGuildDocument } from "../database/guild";

export async function run(member: GuildMember, channel: VoiceBasedChannel) {
    const document = await getGuildDocument(member.guild.id);

    if (document.voices.get(channel.id)?.ownerId === member.id) {
        document.voices.delete(channel.id);
        document.safeSave();

        return channel.delete().catch(() => null);
    };
};