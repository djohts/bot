import { GuildMember } from "discord.js";
import { Schema, model } from "mongoose";
import { getDateFormatted } from "../constants/time";
import { GuildObject } from "../constants/types";

const dbCache = new Map<string, GuildObject>(), dbSaveQueue = new Map<string, string[]>();

const guildObject = {
    guildid: "",
    // moderation data
    voices: {},
    bans: {},
    // counting
    channel: "",
    count: 0,
    user: "",
    modules: [],
    flows: {},
    message: "",
    users: {},
    liveboard: {},
    log: {},
    // buttonroles
    brcs: {},
    brms: {},
    brs: {}
} as GuildObject;

const guildSchema = new Schema(guildObject as any, { minimize: true });
const Guild = model("Guild", guildSchema);

const get = (guildid: string) => new Promise((resolve, reject) => Guild.findOne({ guildid }, (err: Error, guild: any) => {
    if (err) return reject(err);
    if (!guild) {
        guild = new Guild(guildObject);
        guild.guildid = guildid;
    };
    return resolve(guild);
}));

const load = async (guildid: string) => {
    const guild = await get(guildid), guildCache = {}, freshGuildObject = guildObject;
    for (const key in freshGuildObject) guildCache[key] = guild[key] || freshGuildObject[key];
    return dbCache.set(guildid, guildCache as any);
};

const save = async (guildid: string, changes: string[]) => {
    if (!dbSaveQueue.has(guildid)) {
        dbSaveQueue.set(guildid, changes);
        const guild = await get(guildid), guildCache = dbCache.get(guildid), guildSaveQueue = dbSaveQueue.get(guildid);
        for (const key of guildSaveQueue) guild[key] = guildCache[key];
        return (guild as any).save().then(() => {
            let newSaveQueue = dbSaveQueue.get(guildid);
            if (newSaveQueue.length > guildSaveQueue.length) {
                dbSaveQueue.delete(guildid);
                save(guildid, newSaveQueue.filter((key: string) => !guildSaveQueue.includes(key)));
            } else dbSaveQueue.delete(guildid);
        }).catch(console.log);
    } else dbSaveQueue.get(guildid).push(...changes);
};

export default () => (async (guildid: string) => {
    if (!dbCache.has(guildid)) await load(guildid);
    return {
        reload: () => load(guildid),
        unload: () => dbCache.delete(guildid),

        get: () => Object.assign({}, dbCache.get(guildid)),
        set: (key: string, value: string | number | object | boolean) => {
            dbCache.get(guildid)[key] = value;
            save(guildid, [key]);

            return dbCache.get(guildid);
        },
        setMultiple: (changes: object) => {
            let guildCache = dbCache.get(guildid);
            Object.assign(guildCache, changes);

            save(guildid, Object.keys(changes));

            return dbCache.get(guildid);
        },
        addToArray: (array: string, value: string | number | object | boolean) => {
            dbCache.get(guildid)[array].push(value);
            save(guildid, [array]);

            return dbCache.get(guildid);
        },
        removeFromArray: (array: string, value: string | number | object | boolean) => {
            dbCache.get(guildid)[array] = dbCache.get(guildid)[array].filter((aValue: string | number | object | boolean) => aValue !== value);
            save(guildid, [array]);

            return dbCache.get(guildid);
        },
        setOnObject: (object: string, key: string, value: string | number | object | boolean) => {
            dbCache.get(guildid)[object][key] = value;
            save(guildid, [object]);

            return dbCache.get(guildid);
        },
        removeFromObject: (object: string, key: string) => {
            delete dbCache.get(guildid)[object][key];
            save(guildid, [object]);

            return dbCache.get(guildid);
        },
        reset: () => {
            let guildCache = dbCache.get(guildid);
            Object.assign(guildCache, guildObject);
            guildCache.guildid = guildid;

            save(guildid, Object.keys(guildObject));

            return dbCache.get(guildid);
        },
        addToCount: (member: GuildMember) => {
            let guildCache = dbCache.get(guildid);
            guildCache.count++;
            guildCache.user = member.id;

            if (!guildCache.users[member.id]) guildCache.users[member.id] = 0;
            guildCache.users[member.id]++;

            let dateFormat = getDateFormatted(new Date());
            if (!guildCache.log[dateFormat]) {
                guildCache.log[dateFormat] = 0;
                while (Object.keys(guildCache.log).length > 7) delete guildCache.log[Object.keys(guildCache.log)[0]];
            };
            guildCache.log[dateFormat] += 1;

            save(guildid, ["count", "user", "users", "log", "message"]);

            return dbCache.get(guildid);
        }
    };
});

export async function cacheGuilds(guilds: Set<string>) {
    let gdbs = await Guild.find({ $or: [...guilds].map((guildid) => ({ guildid })) });
    return await Promise.all([...guilds].map(async (guildid) => {
        const guild = gdbs.find((db) => db.guildid === guildid) || { guildid };
        const guildCache = {};
        const freshGuildObject = guildObject;

        for (const key in freshGuildObject) guildCache[key] = guild[key] || freshGuildObject[key];

        return dbCache.set(guildid, guildCache as any);
    }));
};