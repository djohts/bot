import { GuildMember, VoiceChannel, StageChannel } from "discord.js";
import { ModifiedClient } from "../constants/types";

export const name = "voiceChannelJoin";
export async function run(client: ModifiedClient, member: GuildMember, channel: VoiceChannel | StageChannel) {
    const gset = await client.db.settings(member.guild.id);
    const { voices } = gset.get();
    if (!voices.enabled || voices.lobby != channel.id) return;
    const gdb = await client.db.guild(member.guild.id);

    member.guild.channels.create("Комната " + member.user.tag, {
        type: "GUILD_VOICE",
        parent: channel.parentId,
        permissionOverwrites: [{
            id: member.user.id,
            allow: ["MANAGE_CHANNELS", "PRIORITY_SPEAKER", "STREAM", "CONNECT", "SPEAK"]
        }]
    }).then((ch) => {
        member.voice.setChannel(ch.id).then(() => gdb.setOnObject("voices", ch.id, member.user.id)).catch(() => null);
    }).catch(() => null);
};