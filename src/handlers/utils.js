const bulks = new Map(), rates = new Map();
const { Message } = require("discord.js");

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