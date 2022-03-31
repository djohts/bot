"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
exports.name = "voiceChannelSwitch";
async function run(client, member, oldChannel, newChannel) {
    const gset = await client.db.settings(member.guild.id);
    const { voices } = gset.get();
    if (!voices.enabled || voices.lobby != oldChannel.id)
        return;
    const gdb = await client.db.guild(member.guild.id);
    member.guild.channels.create("Комната " + member.user.tag, {
        type: "GUILD_VOICE",
        parent: newChannel.parentId,
        permissionOverwrites: [{
                id: member.user.id,
                allow: ["MANAGE_CHANNELS", "PRIORITY_SPEAKER", "STREAM", "CONNECT", "SPEAK"]
            }]
    }).then((ch) => {
        member.voice.setChannel(ch.id).then(() => gdb.setOnObject("voices", ch.id, member.user.id)).catch(() => null);
    }).catch(() => null);
}
exports.run = run;
;
