import { GuildMember, ChannelType, PermissionFlagsBits, VoiceBasedChannel } from "discord.js";
import { getGuildDocument } from "../database/guild";
import Util from "../util/Util";

export async function run(member: GuildMember, channel: VoiceBasedChannel) {
    const document = await getGuildDocument(member.guild.id);
    const _ = Util.i18n.getLocale(document.locale);

    if (!document.settings.voices_enabled || document.settings.voices_lobby !== channel.id) return;

    return member.guild.channels.create({
        name: _("events.voiceChannelJoin.roomName", { user: `${member.user.tag}` }),
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
        .then((ch) =>
            member.voice.setChannel(ch.id)
                .then(() => {
                    document.voices.set(ch.id, { ownerId: member.id });
                    document.safeSave();
                })
                .catch(() => ch.delete().catch(() => null))
        )
        .catch(() => null);
};