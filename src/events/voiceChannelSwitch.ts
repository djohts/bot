import { GuildMember, VoiceChannel, StageChannel } from "discord.js";
import Util from "../util/Util";

export const name = "voiceChannelSwitch";
export async function run(member: GuildMember, oldChannel: VoiceChannel | StageChannel, newChannel: VoiceChannel | StageChannel) {
    const gset = await Util.database.settings(member.guild.id);
    const { voices } = gset.get();
    const gdb = await Util.database.guild(member.guild.id);

    if (gdb.get().voices[oldChannel.id] === member.user.id) {
        await oldChannel.delete().catch(() => null);
        gdb.removeFromObject("voices", oldChannel.id);
    };
    if (voices.lobby === newChannel.id && voices.enabled) {
        await member.guild.channels.create("Комната " + member.user.tag, {
            type: "GUILD_VOICE",
            parent: newChannel.parentId,
            permissionOverwrites: [{
                id: member.user.id,
                allow: ["MANAGE_CHANNELS", "PRIORITY_SPEAKER", "STREAM"]
            }]
        })
            .then(async (ch) => await member.voice.setChannel(ch.id)
                .then(() => gdb.setOnObject("voices", ch.id, member.user.id))
                .catch(() => null))
            .catch(() => null);
    };
};