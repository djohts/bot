const { Client } = require("discord.js");
const db = require("../database/")();

module.exports = (client) => {
    if (!(client instanceof Client)) return;

    updatePresence(client);
    checkMutes(client);
    checkBans(client);
};

function updatePresence(client) {
    if (!(client instanceof Client)) return;

    client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => {
        const gc = res.reduce((prev, curr) => prev + curr, 0);
        client.user.setPresence({
            status: "idle",
            activities: [{ type: "PLAYING", name: `250? -> | ${gc} guilds` }],
        });
        setTimeout(() => updatePresence(client), 5 * 60 * 1000);
    });
};

function checkMutes(client) {
    if (!(client instanceof Client)) return;

    Promise.all(client.guilds.cache.map(async (guild) => {
        if (!guild.available) return;

        const gdb = await db.guild(guild.id);
        const gsdb = await db.settings(guild.id);
        let { mutes } = gdb.get();
        let ids = Object.keys(mutes || {}).filter((key) => mutes[key] != -1 && mutes[key] < Date.now());
        if (!ids.length) return;

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
    })).then(() => setTimeout(() => checkMutes(client), 2000));
};

function checkBans(client) {
    if (!(client instanceof Client)) return;

    Promise.all(client.guilds.cache.map(async (guild) => {
        if (!guild.available) return;

        const gdb = await db.guild(guild.id);
        let { bans } = gdb.get();
        let ids = Object.keys(bans || {}).filter((key) => bans[key] != -1 && bans[key] < Date.now());
        if (!ids.length) return;

        await Promise.all(ids.map(async (key) => {
            if (!guild.me.permissions.has("BAN_MEMBERS")) return;

            await guild.bans.remove(key).then(() => {
                return gdb.removeFromObject("bans", key);
            }).catch(() => {
                return gdb.removeFromObject("bans", key);
            });
        }));
    })).then(() => setTimeout(() => checkBans(client), 10 * 1000));
};