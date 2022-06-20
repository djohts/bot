"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const Util_1 = __importDefault(require("../util/Util"));
async function run(deleted) {
    const gdb = await Util_1.default.database.guild(deleted.guild.id);
    const { modules, channel, message, user, count } = gdb.get();
    if (channel === deleted.channel.id &&
        message === deleted.id &&
        !modules.includes("embed") &&
        !modules.includes("webhook")) {
        const newMessage = await deleted.channel.send(`${deleted.author || `<@${user}>`}: ${deleted.content || count}`);
        gdb.set("message", newMessage.id);
    }
    ;
}
exports.run = run;
;
