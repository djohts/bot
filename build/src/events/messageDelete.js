"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const database_1 = __importDefault(require("../database/"));
exports.name = "messageDelete";
async function run(client, deleted) {
    const gdb = await database_1.default.guild(deleted.guild.id);
    const { modules, channel, message, user, count } = gdb.get();
    if (channel == deleted.channel.id &&
        message == deleted.id &&
        !modules.includes("embed") &&
        !modules.includes("webhook")) {
        const newMessage = await deleted.channel.send(`${deleted.author || `<@${user}>`}: ${deleted.content || count}`);
        gdb.set("message", newMessage.id);
    }
    ;
}
exports.run = run;
;
