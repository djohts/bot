"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
exports.name = "voiceChannelLeave";
async function run(client, member, channel) {
    const gdb = await client.db.guild(member.guild.id);
    if (gdb.get().voices[channel.id] == member.user.id) {
        channel.delete().catch(() => null) && gdb.removeFromObject("voices", channel.id);
    }
    ;
}
exports.run = run;
;
