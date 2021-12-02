const { Client } = require("discord.js");
const db = require("../database/")();
const config = require("../../config");

module.exports = async (client = new Client) => {
    await updatePresence(client);

    setInterval(() => updatePresence(client), 60 * 1000);
    setInterval(() => checkMutes(client), 4 * 1000);
    setInterval(() => checkBans(client), 6 * 1000);

    if (config.sdcToken) {
        await postStats();
        setInterval(postStats, 5 * 60 * 1000);
    };
};

async function updatePresence(client) {
    const gc = await client.shard.broadcastEval(bot => bot.guilds.cache.size).then(res => res.reduce((prev, curr) => prev + curr, 0));
    let text = `хочу 75 -> | ${gc} guilds`;
    return client.user.setPresence({
        status: "idle",
        activities: [{ type: "PLAYING", name: text }],
    });
};

async function postStats(client = new Client) {
    const sdcToken = "SDC " + config.sdcToken;
    const route = "https://api.server-discord.com/v2";
    const shardCount = client.shard.count;
    const guildCount = await client.shard.broadcastEval(bot => bot.guilds.cache.size).then((res) => res.reduce((prev, curr) => prev + curr, 0));
    const botUser = client.user;

    await fetch(route + `/bots/${botUser.id}/stats`, {
        method: "post",
        body: JSON.stringify({
            shards: shardCount,
            servers: guildCount
        }),
        headers: {
            "Content-type": "application/json",
            "Authorization": sdcToken
        }
    }).then(async (res) => console.info("[SDC API] Posted stats for " + botUser.tag, await res.json()));
};

async function checkMutes(client = new Client) {
    return client.guilds.cache.map(async (guild) => {
        if (!guild.available) return;

        const gdb = await db.guild(guild.id);
        const gsdb = await db.settings(guild.id);
        let mutes = Object.keys(gdb.get().mutes);
        if (!mutes.length) return;

        mutes = mutes.filter((key) => gdb.get().mutes[key] != -1 && gdb.get().mutes[key] < Date.now());

        return mutes.map(async (key) => {
            const member = await guild.members.fetch(key).catch(() => gdb.removeFromObject("mutes", key));
            return member?.roles.remove(gsdb.get().muteRole).then(() => {
                return gdb.removeFromObject("mutes", key);
            }).catch(() => {
                return gdb.removeFromObject("mutes", key);
            });
        });
    });
};

async function checkBans(client = new Client) {
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