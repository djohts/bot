"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const Util_1 = __importDefault(require("../util/Util"));
async function run(member, oldChannel, newChannel) {
    const gset = await Util_1.default.database.settings(member.guild.id);
    const { voices } = gset.get();
    const gdb = await Util_1.default.database.guild(member.guild.id);
    if (gdb.get().voices[oldChannel.id] === member.user.id) {
        await oldChannel.delete().catch(() => null);
        gdb.removeFromObject("voices", oldChannel.id);
    }
    ;
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
            .catch(() => ch.delete().catch(() => null)))
            .catch(() => null);
    }
    ;
}
exports.run = run;
;
