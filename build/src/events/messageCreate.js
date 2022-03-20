"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const stop_discord_phishing_1 = require("stop-discord-phishing");
const counting_1 = __importDefault(require("../handlers/counting"));
const bot_1 = require("../bot");
const database_1 = __importDefault(require("../database/"));
const utils_1 = require("../handlers/utils");
exports.name = "messageCreate";
async function run(client, message) {
    if (!message.guild ||
        message.author.bot ||
        message.channel.type == "DM" ||
        message.channel.name == "dob-flow-editor")
        return;
    const gdb = await database_1.default.guild(message.guild.id);
    const gsdb = await database_1.default.settings(message.guild.id);
    if (gdb.get().mutes.hasOwnProperty(message.author.id) && gsdb.get().delMuted)
        return (0, utils_1.deleteMessage)(message);
    if (gsdb.get().detectScamLinks && await (0, stop_discord_phishing_1.checkMessage)(message.content, true)) {
        let guildRates = bot_1.linkRates.get(message.guild.id);
        if (!guildRates.has(message.author.id)) {
            await message.channel.send(`${message.author}, в вашем сообщении была замечена вредоносная ссылка. Сообщение ` +
                (message.deletable ? "будет удалено." : "не будет удалено, так как у меня нет прав на удаление сообщений в этом канале.")).then((m) => setTimeout(() => (0, utils_1.deleteMessage)(m), 10 * 1000));
            guildRates.add(message.author.id);
            setTimeout(() => guildRates.delete(message.author.id), 5000);
        }
        ;
        bot_1.linkRates.set(message.guild.id, guildRates);
        return (0, utils_1.deleteMessage)(message);
    }
    ;
    global.gdb = gdb;
    global.gsdb = gsdb;
    global.gldb = database_1.default.global;
    const { channel } = gdb.get();
    if (channel == message.channel.id)
        return (0, counting_1.default)(message);
    if (message.content.match(`^<@!?${client.user.id}>`))
        return message.react("👋").catch(() => false);
}
exports.run = run;
;
