const bulks = new Map(), rates = new Map();
const { Message, Client } = require("discord.js");
const db = require("../database/")();

module.exports.deleteMessage = (message = new Message) => {
    const rate = rates.get(message.channel.id) || 0;
    rates.set(message.channel.id, rate + 1);

    setTimeout(() => rates.set(message.channel.id, rates.get(message.channel.id) - 1), 5000);

    const bulk = bulks.get(message.channel.id) || [];
    if (bulk.length) bulk.push(message);
    else if (rate < 3) message.delete().catch();
    else {
        bulks.set(message.channel.id, [message]);
        setTimeout(() => {
            message.channel.bulkDelete(bulks.get(message.channel.id)).catch();
            bulks.delete(message.channel.id);
        }, 5000);
    };
};

module.exports.checkMutes = async (client = new Client) => {
    return client.guilds.cache.map(async (guild) => {
        if (!guild.available) return;

        const guilddb = await db.guild(guild.id);
        let mutes = Object.keys(guilddb.get().mutes);
        if (!mutes.length) return;

        mutes = mutes.filter((key) => guilddb.get().mutes[key] != -1 && guilddb.get().mutes[key] < Date.now());

        mutes.forEach(async (key) => {
            const member = await guild.members.fetch(key);
            member.roles.remove(guilddb.get().settings.muteRole).then(() => {
                guilddb.removeFromObject("mutes", key);
            }).catch();
        });
    });
};