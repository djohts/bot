"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const discord_js_1 = require("discord.js");
const Util_1 = __importDefault(require("../util/Util"));
exports.name = "channelDelete";
const run = async (channel) => {
    if (channel.type !== discord_js_1.ChannelType.GuildVoice)
        return;
    const player = Util_1.default.lava.get(channel.guild.id);
    if (player?.options.voiceChannel === channel.id) {
        const text = Util_1.default.client.channels.cache.get(player.options.textChannel);
        try {
            let message = player.get("message");
            if (!message || !message.editable)
                await text.send({ content: "Канал был удалён. Останавливаю плеер.", embeds: [] });
            else
                await message.edit({ content: "Канал был удалён. Останавливаю плеер.", embeds: [] });
        }
        catch { }
        ;
        player.destroy();
    }
    ;
};
exports.run = run;
