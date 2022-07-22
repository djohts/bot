"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const handler_1 = __importDefault(require("../handlers/counting/handler"));
const bot_1 = require("../bot");
const Util_1 = __importDefault(require("../util/Util"));
const index_1 = require("../constants/index");
async function run(message) {
    if (!message.guild ||
        message.author.bot ||
        message.channel.type === "DM" ||
        message.channel.name === "dob-flow-editor")
        return;
    const gdb = await Util_1.default.database.guild(message.guild.id);
    const { channel } = gdb.get();
    if (channel === message.channel.id)
        return await (0, handler_1.default)(message);
    if ((0, index_1.getPermissionLevel)(message.member) >= 5)
        return bot_1.dokdo.run(message);
    if (message.content.match(`^<@!?${Util_1.default.client.user.id}>`))
        return await message.react("👋").catch(() => null);
}
exports.run = run;
;
