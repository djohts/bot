"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const Util_1 = __importDefault(require("../util/Util"));
async function run(member, channel) {
    const gdb = await Util_1.default.database.guild(member.guild.id);
    if (gdb.get().voices[channel.id] === member.user.id) {
        await channel.delete().catch(() => null);
        gdb.removeFromObject("voices", channel.id);
    }
    ;
}
exports.run = run;
;
