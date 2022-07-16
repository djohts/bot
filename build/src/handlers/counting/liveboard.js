"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const constants_1 = require("../../constants/");
const Util_1 = __importDefault(require("../../util/Util"));
module.exports = (client) => Promise.all(client.guilds.cache.map(async (guild) => {
    const gdb = await Util_1.default.database.guild(guild.id);
    const { liveboard: { channel: channelId, message: messageId }, users } = gdb.get();
    if (channelId && messageId) {
        const channel = client.channels.resolve(channelId);
        if (!channel)
            return gdb.set("liveboard", {});
        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message || !message.editable)
            return gdb.set("liveboard", {});
        const top = Object.keys(users).sort((a, b) => users[b] - users[a]).slice(0, 25);
        const leaderboard = top.map((id, index) => (0, constants_1.formatScore)(id, index, users, message.author.id));
        const description = leaderboard.join("\n");
        return await message.edit({
            content: null,
            embeds: [{
                    title: `Лидеры ${message.guild.name}`,
                    thumbnail: {
                        url: message.guild.iconURL({ dynamic: true })
                    },
                    description,
                    timestamp: Date.now()
                }]
        }).catch(() => null);
    }
}));
