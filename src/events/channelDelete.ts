import { Channel, ChannelType, Message, TextChannel } from "discord.js";
import Util from "../util/Util";

export const name = "channelDelete";
export const run = async (channel: Channel) => {
    if (channel.type !== ChannelType.GuildVoice) return;

    const player = Util.lava.get(channel.guild.id);

    if (player?.options.voiceChannel === channel.id) {
        const text = Util.client.channels.cache.get(player.options.textChannel) as TextChannel;

        try {
            let message = player.get("message") as Message | undefined;
            if (!message || !message.editable) await text.send({ content: "Канал был удалён. Останавливаю плеер.", embeds: [] });
            else await message.edit({ content: "Канал был удалён. Останавливаю плеер.", embeds: [] });
        } catch { };
        player.destroy();
    };
};