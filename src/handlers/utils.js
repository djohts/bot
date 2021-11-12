const bulks = new Map(), rates = new Map();
const { Message, Client } = require("discord.js");
const db = require("../database/")();

module.exports.deleteMessage = (message = new Message) => {
    const rate = rates.get(message.channel.id) || 0;
    rates.set(message.channel.id, rate + 1);

    setTimeout(() => rates.set(message.channel.id, rates.get(message.channel.id) - 1), 10000);

    const bulk = bulks.get(message.channel.id) || [];
    if (bulk.length) bulk.push(message);
    else if (rate < 3) message.delete().catch(() => { });
    else {
        bulks.set(message.channel.id, [message]);
        setTimeout(() => {
            message.channel.bulkDelete(bulks.get(message.channel.id)).catch(() => { });
            bulks.delete(message.channel.id);
        }, 5000);
    };
};

module.exports.checkMutes = async (client = new Client) => {
    return client.guilds.cache.map(async (guild) => {
        if (!guild.available) return;

        const gdb = await db.guild(guild.id);
        const gsdb = await db.settings(guild.id);
        let mutes = Object.keys(gdb.get().mutes);
        if (!mutes.length) return;

        mutes = mutes.filter((key) => gdb.get().mutes[key] != -1 && gdb.get().mutes[key] < Date.now());

        return mutes.map(async (key) => {
            const member = await guild.members.fetch(key);
            return member?.roles.remove(gsdb.get().muteRole).then(() => {
                return gdb.removeFromObject("mutes", key);
            }).catch(() => {
                return gdb.removeFromObject("mutes", key);
            });
        });
    });
};

module.exports.checkBans = async (client = new Client) => {
    return client.guilds.cache.map(async (guild) => {
        if (!guild.available) return;

        const guilddb = await db.guild(guild.id);
        let bans = Object.keys(guilddb.get().bans);
        if (!bans.length) return;

        bans = bans.filter((key) => guilddb.get().bans[key] != -1 && guilddb.get().bans[key] < Date.now());

        return bans.map(async (key) => {
            return guild.bans.fetch(key).then(async () => {
                await guild.bans.remove(key);
                return guilddb.removeFromObject("bans", key);
            }).catch(() => {
                return guilddb.removeFromObject("bans", key);
            });
        });
    });
};