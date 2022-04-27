import { GuildMember, VoiceChannel, StageChannel } from "discord.js";
import Util from "../util/Util";

export async function run(member: GuildMember, channel: VoiceChannel | StageChannel) {
    const gset = await Util.database.settings(member.guild.id);
    const { voices } = gset.get();
    if (!voices.enabled || voices.lobby !== channel.id) return;
    const gdb = await Util.database.guild(member.guild.id);

    await member.guild.channels.create("Комната " + member.user.tag, {
        type: "GUILD_VOICE",
        parent: channel.parentId,
        permissionOverwrites: [{
            id: member.user.id,
            allow: ["MANAGE_CHANNELS", "PRIORITY_SPEAKER", "STREAM", "CONNECT", "SPEAK"]
        }]
    })
        .then(async (ch) =>
            await member.voice.setChannel(ch.id)
                .then(() => gdb.setOnObject("voices", ch.id, member.user.id))
                .catch(() => ch.delete().catch(() => null))
        )
        .catch(() => null);
};