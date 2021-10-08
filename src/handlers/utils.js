const bulks = new Map(), rates = new Map();
const { Message, Client } = require("discord.js");
const db = require("../database/")();
const Tesseract = require("tesseract.js");

module.exports.deleteMessage = (message = new Message) => {
    const rate = rates.get(message.channel.id) || 0;
    rates.set(message.channel.id, rate + 1);

    setTimeout(() => rates.set(message.channel.id, rates.get(message.channel.id) - 1), 5000);

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

        const guilddb = await db.guild(guild.id);
        let mutes = Object.keys(guilddb.get().mutes);
        if (!mutes.length) return;

        mutes = mutes.filter((key) => guilddb.get().mutes[key] != -1 && guilddb.get().mutes[key] < Date.now());

        return mutes.map(async (key) => {
            const member = await guild.members.fetch(key);
            return member?.roles.remove(guilddb.get().settings.muteRole).then(() => {
                guilddb.removeFromObject("mutes", key);
            }).catch(() => { });
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
            return guild.bans.fetch(key).then(() => {
                return guild.bans.remove(key).then(() => guilddb.removeFromObject("bans", key)).catch();
            }).catch((err) => {
                if (err.message.toLowerCase().includes("unknown ban")) return guilddb.removeFromObject("bans", key);
            });
        });
    });
};

module.exports.parseImage = async (imageUrl = "", lang = "") => new Promise(async (res, rej) => {
    const image = await new Promise(async (resolve, reject) => {
        const isImage = require('image-url-validator').default;
        if (await isImage(imageUrl)) resolve(imageUrl);
        else reject();
    });
    if (!image || !lang.length) rej();

    const { createWorker } = Tesseract;
    const worker = createWorker({
        langPath: __dirname + "/../langs",
        gzip: true
    });

    await worker.load();
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    const { data: { text } } = await worker.recognize(image);
    await worker.terminate();

    res(text);
});