"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const utils_1 = require("../handlers/utils");
const Util_1 = __importDefault(require("../util/Util"));
exports.name = "messageUpdate";
async function run(original, updated) {
    const gdb = await Util_1.default.database.guild(updated.guild.id);
    const { modules, channel, message, count } = gdb.get();
    if (channel == updated.channel.id &&
        message == updated.id &&
        !modules.includes("embed") &&
        !modules.includes("webhook") &&
        (modules.includes("talking")
            ? (original.content || `${count}`).split(" ")[0] != updated.content.split(" ")[0]
            : (original.content || `${count}`) != updated.content)) {
        const newMessage = await updated.channel.send(`${updated.author}: ${original.content || count}`);
        gdb.set("message", newMessage.id);
        (0, utils_1.deleteMessage)(original);
    }
    ;
}
exports.run = run;
;
