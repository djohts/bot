import { AnyChannel, TextChannel } from "discord.js";
import { ModifiedClient } from "../constants/types";

export const name = "channelDelete";
export async function run(client: ModifiedClient, channel: AnyChannel) {
    if (channel.type == "DM") return;

    const player = client.manager.get(channel.guild.id);

    if (
        player?.voiceChannel == channel.id
    ) {
        const text = client.channels.cache.get(player.textChannel) as TextChannel;

        text.send("Канал был удалён. Останавливаю плеер.").catch(() => null);
        player.destroy();
    };
};