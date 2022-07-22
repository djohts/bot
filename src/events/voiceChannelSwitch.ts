import { GuildMember, Channel, ChannelType, PermissionFlagsBits } from "discord.js";
import Util from "../util/Util";

export async function run(member: GuildMember, oldChannel: Channel, newChannel: Channel) {
    if (
        oldChannel.type !== ChannelType.GuildVoice ||
        newChannel.type !== ChannelType.GuildVoice
    ) return;
    const gset = await Util.database.settings(member.guild.id);
    const { voices } = gset.get();
    const gdb = await Util.database.guild(member.guild.id);

    if (gdb.get().voices[oldChannel.id] === member.user.id) {
        await oldChannel.delete().catch(() => null);
        gdb.removeFromObject("voices", oldChannel.id);
    };

    if (voices.lobby === newChannel.id && voices.enabled) {
        await member.guild.channels.create({
            name: "Комната " + member.user.tag,
            type: ChannelType.GuildVoice,
            parent: newChannel.parentId,
            permissionOverwrites: [{
                id: member.user.id,
                allow: [
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.PrioritySpeaker,
                    PermissionFlagsBits.Stream,
                    PermissionFlagsBits.Connect,
                    PermissionFlagsBits.Speak
                ]
            }]
        })
            .then(async (ch) =>
                await member.voice.setChannel(ch.id)
                    .then(() => gdb.setOnObject("voices", ch.id, member.user.id))
                    .catch(() => ch.delete().catch(() => null))
            )
            .catch(() => null);
    };
};