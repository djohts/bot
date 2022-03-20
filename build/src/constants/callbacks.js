"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voicesSwitch = exports.voicesLeave = exports.voicesJoin = void 0;
const database_1 = __importDefault(require("../database/"));
async function voicesJoin(member, channel) {
    const gset = await database_1.default.settings(member.guild.id);
    const { voices } = gset.get();
    if (!voices.enabled || voices.lobby != channel.id)
        return;
    const gdb = await database_1.default.guild(member.guild.id);
    member.guild.channels.create("Комната " + member.user.tag, {
        type: "GUILD_VOICE",
        parent: channel.parentId,
        permissionOverwrites: [{
                id: member.user.id,
                allow: ["MANAGE_CHANNELS", "PRIORITY_SPEAKER", "STREAM", "CONNECT", "SPEAK"]
            }]
    }).then((ch) => {
        member.voice.setChannel(ch.id).then(() => gdb.setOnObject("voices", ch.id, member.user.id)).catch(() => null);
    }).catch(() => null);
}
exports.voicesJoin = voicesJoin;
;
async function voicesLeave(member, channel) {
    const gdb = await database_1.default.guild(member.guild.id);
    if (gdb.get().voices[channel.id] == member.user.id) {
        channel.delete().catch(() => null) && gdb.removeFromObject("voices", channel.id);
    }
    ;
}
exports.voicesLeave = voicesLeave;
;
async function voicesSwitch(member, oldChannel, newChannel) {
    const gset = await database_1.default.settings(member.guild.id);
    const { voices } = gset.get();
    const gdb = await database_1.default.guild(member.guild.id);
    if (gdb.get().voices[oldChannel.id] == member.user.id) {
        oldChannel.delete().catch(() => null) && gdb.removeFromObject("voices", oldChannel.id);
    }
    ;
    if (voices.lobby == newChannel.id && voices.enabled) {
        member.guild.channels.create("Комната " + member.user.tag, {
            type: "GUILD_VOICE",
            parent: newChannel.parentId,
            permissionOverwrites: [{
                    id: member.user.id,
                    allow: ["MANAGE_CHANNELS", "PRIORITY_SPEAKER", "STREAM"]
                }]
        }).then((ch) => {
            member.voice.setChannel(ch.id).catch(() => null) && gdb.setOnObject("voices", ch.id, member.user.id);
        }).catch(() => null);
    }
    ;
}
exports.voicesSwitch = voicesSwitch;
;
