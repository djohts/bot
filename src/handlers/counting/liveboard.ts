import { Client, Message, TextChannel } from "discord.js";
import { formatScore } from "../../constants/";
import Util from "../../util/Util";

export = (client: Client) => Promise.all(client.guilds.cache.map(async (guild) => {
    const gdb = await Util.database.guild(guild.id);
    const { liveboard: { channel: channelId, message: messageId }, users } = gdb.get();

    if (channelId && messageId) {
        const channel: TextChannel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel) return;
        const message: Message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) return;

        const top = Object.keys(users).sort((a, b) => users[b] - users[a]).slice(0, 25);
        const leaderboard = top.map((id, index) => formatScore(id, index, users, message.author.id));
        const description = leaderboard.join("\n");

        await message.edit({
            content: null,
            embeds: [{
                author: {
                    name: `Лидеры ${message.guild.name}`,
                    icon_url: message.guild.iconURL({ dynamic: true })
                },
                description,
                timestamp: Date.now()
            }]
        }).catch(() => null);
    }
}));