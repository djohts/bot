import { GuildMember, ChannelType, PermissionFlagsBits, VoiceBasedChannel } from "discord.js";
import { getGuildDocument } from "../database";
import i18next from "i18next";

export async function run(member: GuildMember, oldChannel: VoiceBasedChannel, newChannel: VoiceBasedChannel) {
    const document = await getGuildDocument(member.guild.id);
    const t = i18next.getFixedT(document.locale, null, "events.voiceChannelJoin");

    const voices = Array.from(document.voices.keys());

    if (document.voices.get(oldChannel.id)?.ownerId === member.id) {
        document.voices.delete(oldChannel.id);
        document.safeSave();
        void oldChannel.delete().catch(() => null);
    };

    if (document.settings.voices_enabled && document.settings.voices_lobby === newChannel.id) {
        if (voices.includes(oldChannel.id)) return;

        return member.guild.channels.create({
            name: t("roomName", { user: `${member.user.tag}` }),
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
            .then((ch) => member.voice.setChannel(ch.id)
                .then(() => {
                    document.voices.set(ch.id, { ownerId: member.id });
                    document.safeSave();
                })
                .catch(() => ch.delete().catch(() => null)))
            .catch(() => null);
    };
};