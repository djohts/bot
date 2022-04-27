import { AnyChannel, TextChannel } from "discord.js";
import Util from "../util/Util";

export const name = "channelDelete";
export const run = async (channel: AnyChannel): Promise<any> => {
    if (channel.type === "DM") return;

    const player = Util.lava.get(channel.guild.id);

    if (player?.options.voiceChannel === channel.id) {
        const text = Util.client.channels.cache.get(player.options.textChannel) as TextChannel;

        player.destroy();
        await text?.send("Канал был удалён. Останавливаю плеер.").catch(() => null);
    };
};