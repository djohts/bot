"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const stop_discord_phishing_1 = require("stop-discord-phishing");
const handler_1 = __importDefault(require("../handlers/counting/handler"));
const bot_1 = require("../bot");
const utils_1 = require("../handlers/utils");
const Util_1 = __importDefault(require("../util/Util"));
async function run(message) {
    if (!message.guild ||
        message.author.bot ||
        message.channel.type === "DM" ||
        message.channel.name === "dob-flow-editor")
        return;
    const gdb = await Util_1.default.database.guild(message.guild.id);
    const gsdb = await Util_1.default.database.settings(message.guild.id);
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
    const { channel } = gdb.get();
    if (channel === message.channel.id)
        return await (0, handler_1.default)(message);
    if (message.content.match(`^<@!?${Util_1.default.client.user.id}>`))
        return await message.react("👋").catch(() => null);
}
exports.run = run;
;
