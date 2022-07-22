import { GuildMember, Channel, ChannelType, PermissionFlagsBits } from "discord.js";
import Util from "../util/Util";

export async function run(member: GuildMember, channel: Channel) {
    if (channel.type !== ChannelType.GuildVoice) return;
    const gset = await Util.database.settings(member.guild.id);
    const { voices } = gset.get();
    if (!voices.enabled || voices.lobby !== channel.id) return;
    const gdb = await Util.database.guild(member.guild.id);

    await member.guild.channels.create({
        name: "Комната " + member.user.tag,
        type: ChannelType.GuildVoice,
        parent: channel.parentId,
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