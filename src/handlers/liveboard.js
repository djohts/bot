const { Client } = require("discord.js");
const { formatScore } = require("../constants/index");
const db = require("../database/")();

module.exports = (client) => {
    if (!(client instanceof Client)) return;

    return () => Promise.all(client.guilds.cache.map(async (guild) => {
        const gdb = await db.guild(guild.id);
        const { liveboard: { channel: channelId, message: messageId }, users } = gdb.get();

        if (channelId && messageId) {
            const channel = client.channels.resolve(channelId);
            if (!channel) return;
            const message = await channel.messages.fetch(messageId).catch(() => { });
            if (!message) return;

            const sorted = Object.keys(users).sort((a, b) => users[b] - users[a]);
            const top = sorted.slice(0, 25);
            const leaderboard = top.map((id, index) => formatScore(id, index, users, message.author.id));
            const description = leaderboard.join("\n");

            message.edit({
                content: null,
                embeds: [{
                    author: {
                        name: `Лидеры ${message.guild.name}`,
                        icon_url: message.guild.iconURL({ dynamic: true })
                    },
                    description,
                    timestamp: Date.now()
                }]
            }).catch(() => { });
        }
    }));
};