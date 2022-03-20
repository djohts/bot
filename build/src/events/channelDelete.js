"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
exports.name = "channelDelete";
async function run(client, channel) {
    if (channel.type == "DM")
        return;
    const player = client.manager.get(channel.guild.id);
    if (player?.voiceChannel == channel.id) {
        const text = client.channels.cache.get(player.textChannel);
        text.send("Канал был удалён. Останавливаю плеер.").catch(() => null);
        player.destroy();
    }
    ;
}
exports.run = run;
;
