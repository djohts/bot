import { GuildMember, VoiceChannel, StageChannel } from "discord.js";
import { ModifiedClient } from "../constants/types";

export const name = "voiceChannelLeave";
export async function run(client: ModifiedClient, member: GuildMember, channel: VoiceChannel | StageChannel) {
    const gdb = await client.db.guild(member.guild.id);

    if (gdb.get().voices[channel.id] == member.user.id) {
        channel.delete().catch(() => null) && gdb.removeFromObject("voices", channel.id);
    };
};