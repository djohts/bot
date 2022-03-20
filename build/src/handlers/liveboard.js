"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const constants_1 = require("../constants/");
const database_1 = __importDefault(require("../database/"));
module.exports = (client) => Promise.all(client.guilds.cache.map(async (guild) => {
    const gdb = await database_1.default.guild(guild.id);
    const { liveboard: { channel: channelId, message: messageId }, users } = gdb.get();
    if (channelId && messageId) {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel)
            return;
        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message)
            return;
        const top = Object.keys(users).sort((a, b) => users[b] - users[a]).slice(0, 25);
        const leaderboard = top.map((id, index) => (0, constants_1.formatScore)(id, index, users, message.author.id));
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
