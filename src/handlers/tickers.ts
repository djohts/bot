import { ModifiedClient } from "../constants/types";
import db from "../database/";

export = (client: ModifiedClient) => {
    updatePresence(client);
    checkMutes(client);
    checkBans(client);
};

function updatePresence(client: ModifiedClient) {
    client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => {
        const gc = res.reduce((prev, curr) => prev + curr, 0);
        client.user.setPresence({
            status: "idle",
            activities: [{ type: "PLAYING", name: `400? -> | ${gc} guilds` }],
        });
        setTimeout(() => updatePresence(client), 5 * 60 * 1000);
    });
};

function checkMutes(client: ModifiedClient) {
    Promise.all(client.guilds.cache.map(async (guild) => {
        if (!guild.available) return;

        const gdb = await db.guild(guild.id);
        const gsdb = await db.settings(guild.id);
        const { muteRole } = gsdb.get();
        const { mutes } = gdb.get();
        const ids = Object.keys(mutes).filter((key) => mutes[key] !== -1 && mutes[key] < Date.now());
        if (!ids.length) return;

        await Promise.all(ids.map(async (key) => {
            const member = await guild.members.fetch(key).catch(() => null);
            if (
                !member ||
                !member.manageable ||
                !guild.me.permissions.has("MANAGE_ROLES")
            ) return;

            if (!member.roles.cache.has(muteRole)) return gdb.removeFromObject("mutes", key);

            await member.roles.remove(muteRole)
                .then(() => gdb.removeFromObject("mutes", key))
                .catch(() => gdb.removeFromObject("mutes", key));
        }));
    })).then(() => setTimeout(() => checkMutes(client), 5 * 1000));
};

function checkBans(client: ModifiedClient) {
    Promise.all(client.guilds.cache.map(async (guild) => {
        if (!guild.available) return;

        const gdb = await db.guild(guild.id);
        let { bans } = gdb.get();
        let ids = Object.keys(bans).filter((key) => bans[key] !== -1 && bans[key] < Date.now());
        if (!ids.length) return;

        await Promise.all(ids.map(async (key) => {
            if (!guild.me.permissions.has("BAN_MEMBERS")) return;

            await guild.bans.remove(key)
                .then(() => gdb.removeFromObject("bans", key))
                .catch(() => gdb.removeFromObject("bans", key));
        }));
    })).then(() => setTimeout(() => checkBans(client), 10 * 1000));
};