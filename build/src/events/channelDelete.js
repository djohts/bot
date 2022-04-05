"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const Util_1 = __importDefault(require("../util/Util"));
exports.name = "channelDelete";
const run = async (channel) => {
    if (channel.type === "DM")
        return;
    const player = Util_1.default.client.manager.get(channel.guild.id);
    if (player?.voiceChannel === channel.id) {
        const text = Util_1.default.client.channels.cache.get(player.textChannel);
        player.destroy();
        await text.send("Канал был удалён. Останавливаю плеер.").catch(() => null);
    }
    ;
};
exports.run = run;
