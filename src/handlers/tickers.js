const { Client } = require("discord.js");
const db = require("../database/")();
const config = require("../../config");

module.exports = async (client) => {
    if (!(client instanceof Client)) return;

    await updatePresence(client);

    setInterval(() => updatePresence(client), 60 * 1000);
    await checkMutes(client);
    await checkBans(client);
};

async function updatePresence(client) {
    if (!(client instanceof Client)) return;

    const gc = await client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((prev, curr) => prev + curr, 0));
    let text = `200? -> | ${gc} guilds`;
    return client.user.setPresence({
        status: "idle",
        activities: [{ type: "PLAYING", name: text }],
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

        await Promise.all(ids.map(async (key) => {
            const member = await guild.members.fetch(key).catch(() => false);
            if (
                !member ||
                !guild.me.permissions.has("MANAGE_ROLES")
            ) return;

            await member.roles.remove(gsdb.get().muteRole).then(() => {
                return gdb.removeFromObject("mutes", key);
            }).catch(() => {
                return gdb.removeFromObject("mutes", key);
            });
        }));
    }));
    setTimeout(async () => await checkMutes(client), 2000);
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

        await Promise.all(ids.map(async (key) => {
            if (!guild.me.permissions.has("BAN_MEMBERS")) return;

            await guild.bans.remove(key).then(() => {
                return gdb.removeFromObject("bans", key);
            }).catch(() => {
                return gdb.removeFromObject("bans", key);
            });
        }));
    }));
    setTimeout(async () => await checkBans(client), 7000);
};