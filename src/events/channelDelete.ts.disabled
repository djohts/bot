import { Channel, ChannelType, Message, TextChannel } from "discord.js";
import Util from "../util/Util";

export const name = "channelDelete";
export const run = async (channel: Channel) => {
    if (channel.type !== ChannelType.GuildVoice) return;

    const gdb = await Util.database.guild(channel.guildId);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    const player = Util.lava.get(channel.guild.id);

    if (player?.options.voiceChannel === channel.id) {
        const text = Util.client.channels.cache.get(player.options.textChannel) as TextChannel;

        try {
            let message = player.get("message") as Message | undefined;
            if (!message?.editable) await text.send({ content: _("events.channelDelete.playerStop"), embeds: [] });
            else await message.edit({ content: _("events.channelDelete.playerStop"), embeds: [] });
        } catch { };
        player.destroy();
    };
};