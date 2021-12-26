const { Client } = require("discord.js");
const db = require("../database/")();
const config = require("../../config");
const fetch = require("node-fetch");

module.exports = async (client = new Client) => {
    await updatePresence(client);

    setInterval(() => updatePresence(client), 60 * 1000);
    await checkMutes(client);
    await checkBans(client);

    if (config.sdcToken && client.shardId == 0) {
        await postStats(client);
        setInterval(() => postStats(client), 60 * 60 * 1000);
    };
};

async function updatePresence(client = new Client) {
    const gc = await client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((prev, curr) => prev + curr, 0));
    let text = `150? -> | ${gc} guilds`;
    return client.user.setPresence({
        status: "idle",
        activities: [{ type: "PLAYING", name: text }],
    });
};

async function postStats(client = new Client) {
    const sdcToken = "SDC " + config.sdcToken;
    const route = "https://api.server-discord.com/v2";
    const shardCount = client.shard.count;
    const guildCount = await client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((prev, curr) => prev + curr, 0));
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
    }).then(async (res) => {
        let a;
        try {
            a = await res.json();
        } catch {
            a = res.headers;
        };
        console.log("[SDC API] Posted stats for " + botUser.tag, a);
    });
};

async function checkMutes(client) {
    if (!(client instanceof Client)) return;

    await Promise.all(client.guilds.cache.map(async (guild) => {
        if (!guild.available) return;

        const gdb = await db.guild(guild.id);
        const gsdb = await db.settings(guild.id);
        let { mutes } = gdb.get();
        let ids = Object.keys(mutes);
        if (!ids.length) return;

        ids = ids.filter((key) => mutes[key] != -1 && mutes[key] < Date.now());

        return ids.map(async (key) => {
            const member = await guild.members.fetch(key).catch(() => null);
            if (
                !member ||
                !guild.me.permissions.has("MANAGE_ROLES")
            ) return;

            return member.roles.remove(gsdb.get().muteRole).then(() => {
                return gdb.removeFromObject("mutes", key);
            }).catch(() => {
                return gdb.removeFromObject("mutes", key);
            });
        });
    }));
    setTimeout(() => checkMutes(client), 2000);
};

async function checkBans(client) {
    if (!(client instanceof Client)) return;

    await Promise.all(client.guilds.cache.map(async (guild) => {
        if (!guild.available) return;

        const gdb = await db.guild(guild.id);
        let { bans } = gdb.get();
        let ids = Object.keys(bans);
        if (!ids.length) return;

        ids = ids.filter((key) => bans[key] != -1 && bans[key] < Date.now());

        return ids.map(async (key) => {
            if (!guild.me.permissions.has("BAN_MEMBERS")) return;

            guild.bans.remove(key).then(() => {
                return gdb.removeFromObject("bans", key);
            }).catch(() => {
                return gdb.removeFromObject("bans", key);
            });
        });
    }));
    setTimeout(() => checkBans(client), 5000);
};