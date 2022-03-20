import { Schema, model } from "mongoose";
import { GSetObject } from "../constants/types";

const dbCache = new Map<string, GSetObject>(), dbSaveQueue = new Map<string, string[]>();

const gSetObject = {
    guildid: "",
    delMuted: false,
    purgePinned: false,
    detectScamLinks: false,
    muteRole: "",
    voices: { enabled: false, lobby: "", parent: "" }
} as GSetObject;

const gSetSchema = new Schema(gSetObject as any, { minimize: true });
const GSet = model("GSet", gSetSchema);

const get = (guildid: string) => new Promise((resolve, reject) => GSet.findOne({ guildid }, (err: Error, guild: any) => {
    if (err) return reject(err);
    if (!guild) {
        guild = new GSet(gSetObject);
        guild.guildid = guildid;
    };
    return resolve(guild);
}));

const load = async (guildid: string) => {
    const guild = await get(guildid), guildCache = {}, freshGuildObject = gSetObject;
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
                save(guildid, newSaveQueue.filter((key) => !guildSaveQueue.includes(key)));
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
            Object.assign(guildCache, gSetObject);
            guildCache.guildid = guildid;

            save(guildid, Object.keys(gSetObject));

            return dbCache.get(guildid);
        }
    };
});

export async function cacheGSets(guilds: Set<string>) {
    let gsdbs = await GSet.find({ $or: [...guilds].map((guildid) => ({ guildid })) });
    return await Promise.all([...guilds].map(async (guildid) => {
        const guild = gsdbs.find((db) => db.guildid == guildid) || { guildid };
        const guildCache = {};
        const freshGuildObject = gSetObject;

        for (const key in freshGuildObject) guildCache[key] = guild[key] || freshGuildObject[key];

        return dbCache.set(guildid, guildCache as any);
    }));
};