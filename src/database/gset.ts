import { Schema, model } from "mongoose";
import { inspect } from "util";
import { GSetObject } from "../constants/types";
import { clientLogger } from "../util/logger/normal";

const dbCache = new Map<string, GSetObject>(), dbSaveQueue = new Map<string, string[]>();

const gSetObject = {
    guildid: "",
    purgePinned: false,
    voices: { enabled: false, lobby: "" }
} as GSetObject;

const gSetSchema = new Schema(gSetObject, { minimize: true });
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
    const guild = await get(guildid), guildCache = {} as GSetObject, freshGuildObject = gSetObject;
    for (const key in freshGuildObject) guildCache[key] = guild[key] || freshGuildObject[key];
    return dbCache.set(guildid, guildCache);
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
        }).catch((e: any) => void clientLogger.error(inspect(e)));
    } else dbSaveQueue.get(guildid).push(...changes);
};

let timeout: NodeJS.Timeout | null = null;
export default () => (async (guildid: string) => {
    if (!dbCache.has(guildid)) await load(guildid);
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
        if (dbSaveQueue.has(guildid)) save(guildid, dbSaveQueue.get(guildid)).then(() => dbCache.delete(guildid));
    }, 5 * 60 * 1000);
    return {
        reload: () => load(guildid),
        unload: () => dbCache.delete(guildid),

        get: (): GSetObject => Object.assign({}, dbCache.get(guildid)),
        set: (key: string, value: string | number | object | boolean): GSetObject => {
            dbCache.get(guildid)[key] = value;
            save(guildid, [key]);

            return dbCache.get(guildid);
        },
        setMultiple: (changes: object): GSetObject => {
            let guildCache = dbCache.get(guildid);
            Object.assign(guildCache, changes);

            save(guildid, Object.keys(changes));

            return dbCache.get(guildid);
        },
        addToArray: (array: string, value: string | number | object | boolean): GSetObject => {
            dbCache.get(guildid)[array].push(value);
            save(guildid, [array]);

            return dbCache.get(guildid);
        },
        removeFromArray: (array: string, value: string | number | object | boolean): GSetObject => {
            dbCache.get(guildid)[array] = dbCache.get(guildid)[array].filter((aValue: string | number | object | boolean) => aValue !== value);
            save(guildid, [array]);

            return dbCache.get(guildid);
        },
        setOnObject: (object: string, key: string, value: string | number | object | boolean): GSetObject => {
            dbCache.get(guildid)[object][key] = value;
            save(guildid, [object]);

            return dbCache.get(guildid);
        },
        removeFromObject: (object: string, key: string): GSetObject => {
            delete dbCache.get(guildid)[object][key];
            save(guildid, [object]);

            return dbCache.get(guildid);
        },
        reset: (): GSetObject => {
            let guildCache = dbCache.get(guildid);
            Object.assign(guildCache, gSetObject);
            guildCache.guildid = guildid;

            save(guildid, Object.keys(gSetObject));

            return dbCache.get(guildid);
        }
    };
});

export async function cacheGSets(guilds: Set<string>) {
    const gsdbs = await GSet.find({ $or: [...guilds].map((guildid) => ({ guildid })) });
    return [...guilds].map((guildid) => {
        const guild = gsdbs.find((db) => db.guildid === guildid) || { guildid };
        const guildCache = {} as GSetObject;
        const freshGuildObject = gSetObject;

        for (const key in freshGuildObject) guildCache[key] = guild[key] || freshGuildObject[key];

        return dbCache.set(guildid, guildCache);
    });
};