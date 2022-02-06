const { Client } = require("discord.js");
const { formatScore } = require("../constants/");
const db = require("../database/")();

module.exports = (client) => {
    if (!(client instanceof Client)) return;

    return () => Promise.all(client.guilds.cache.map(async (guild) => {
        const gdb = await db.guild(guild.id);
        const { liveboard: { channel: channelId, message: messageId }, users } = gdb.get();

        if (channelId && messageId) {
            const channel = await client.channels.fetch(channelId).catch(() => false);
            if (!channel) return;
            const message = await channel.messages.fetch(messageId).catch(() => false);
            if (!message) return;

            const top = Object.keys(users).sort((a, b) => users[b] - users[a]).slice(0, 25);
            const leaderboard = top.map((id, index) => formatScore(id, index, users, message.author.id));
            const description = leaderboard.join("\n");

            return await message.edit({
                content: null,
                embeds: [{
                    author: {
                        name: `Лидеры ${message.guild.name}`,
                        icon_url: message.guild.iconURL({ dynamic: true })
                    },
                    description,
                    timestamp: Date.now()
                }]
            }).catch(() => false);
        }
    }));
};