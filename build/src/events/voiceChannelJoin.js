"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const Util_1 = __importDefault(require("../util/Util"));
exports.name = "voiceChannelJoin";
async function run(member, channel) {
    const gset = await Util_1.default.database.settings(member.guild.id);
    const { voices } = gset.get();
    if (!voices.enabled || voices.lobby !== channel.id)
        return;
    const gdb = await Util_1.default.database.guild(member.guild.id);
    await member.guild.channels.create("Комната " + member.user.tag, {
        type: "GUILD_VOICE",
        parent: channel.parentId,
        permissionOverwrites: [{
                id: member.user.id,
                allow: ["MANAGE_CHANNELS", "PRIORITY_SPEAKER", "STREAM", "CONNECT", "SPEAK"]
            }]
    })
        .then(async (ch) => await member.voice.setChannel(ch.id)
        .then(() => gdb.setOnObject("voices", ch.id, member.user.id))
        .catch(() => null))
        .catch(() => null);
}
exports.run = run;
;
