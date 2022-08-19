import { Client, TextChannel } from "discord.js";
import { inspect } from "util";
import { formatScore } from "../../constants/";
import { clientLogger } from "../../util/logger/normal";
import Util from "../../util/Util";

export = (client: Client) => Promise.all(client.guilds.cache.map(async (guild) => {
    const gdb = await Util.database.guild(guild.id);
    const { liveboard: { channel: channelId, message: messageId }, users } = gdb.get();

    if (channelId && messageId) {
        const channel = client.channels.resolve(channelId) as TextChannel;
        if (!channel) return gdb.set("liveboard", {});

        const top = Object.keys(users).sort((a, b) => users[b] - users[a]).slice(0, 25);
        const leaderboard = top.map((id, index) => formatScore(id, index, users));
        const description = leaderboard.join("\n");

        return channel.messages.edit(messageId, {
            content: null,
            embeds: [{
                title: `Лидеры ${channel.guild.name}`,
                thumbnail: {
                    url: channel.guild.iconURL()
                },
                description
            }]
        }).catch((e) => clientLogger.error(`[g${guild.id}c${channel.id}m${messageId}] ${inspect(e)}`));
    };
}));