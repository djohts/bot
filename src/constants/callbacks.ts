import { GuildMember, StageChannel, VoiceChannel } from "discord.js";
import db from "../database/";

export async function voicesJoin(member: GuildMember, channel: VoiceChannel | StageChannel) {
    const gset = await db.settings(member.guild.id);
    const { voices } = gset.get();
    if (!voices.enabled || voices.lobby != channel.id) return;
    const gdb = await db.guild(member.guild.id);

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

export async function voicesLeave(member: GuildMember, channel: VoiceChannel | StageChannel) {
    const gdb = await db.guild(member.guild.id);

    if (gdb.get().voices[channel.id] == member.user.id) {
        channel.delete().catch(() => null) && gdb.removeFromObject("voices", channel.id);
    };
};

export async function voicesSwitch(member: GuildMember, oldChannel: VoiceChannel | StageChannel, newChannel: VoiceChannel | StageChannel) {
    const gset = await db.settings(member.guild.id);
    const { voices } = gset.get();
    const gdb = await db.guild(member.guild.id);

    if (gdb.get().voices[oldChannel.id] == member.user.id) {
        oldChannel.delete().catch(() => null) && gdb.removeFromObject("voices", oldChannel.id);
    };
    if (voices.lobby == newChannel.id && voices.enabled) {
        member.guild.channels.create("Комната " + member.user.tag, {
            type: "GUILD_VOICE",
            parent: newChannel.parentId,
            permissionOverwrites: [{
                id: member.user.id,
                allow: ["MANAGE_CHANNELS", "PRIORITY_SPEAKER", "STREAM"]
            }]
        }).then((ch) => {
            member.voice.setChannel(ch.id).catch(() => null) && gdb.setOnObject("voices", ch.id, member.user.id);
        }).catch(() => null);
    };
};