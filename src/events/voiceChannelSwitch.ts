import { GuildMember, ChannelType, PermissionFlagsBits, VoiceBasedChannel } from "discord.js";
import Util from "../util/Util";

export async function run(member: GuildMember, oldChannel: VoiceBasedChannel, newChannel: VoiceBasedChannel) {
    const gdb = await Util.database.guild(member.guild.id);
    const _ = Util.i18n.getLocale(gdb.get().locale);
    const gset = await Util.database.settings(member.guild.id);
    const { voices } = gset.get();

    if (gdb.get().voices[oldChannel.id] === member.user.id) {
        await oldChannel.delete().catch(() => null);
        gdb.removeFromObject("voices", oldChannel.id);
    };

    if (voices.lobby === newChannel.id && voices.enabled) {
        await member.guild.channels.create({
            name: _("events.voiceChannelJoin.roomName", { user: `${member.user.tag}` }),
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