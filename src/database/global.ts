import { Schema, model } from "mongoose";
import { inspect } from "util";
import { GlobalObject } from "../constants/types";
import { clientLogger } from "../util/logger/normal";

const dbCache = new Map<string, GlobalObject>(), dbSaveQueue = new Map<string, string[]>();

const globalObject = {
    maintenance: false,
    boticordBumps: []
} as GlobalObject;

const globalSchema = new Schema(globalObject, { minimize: true });
const Global = model("Global", globalSchema);

const get = () => new Promise((resolve, reject) => Global.findOne({}, (err: Error, global: any) => {
    if (err) return reject(err);
    if (!global) {
        global = new Global(globalObject);
    };
    return resolve(global);
}));

const load = async () => {
    let global = await get(), globalCache = {} as GlobalObject, freshGlobalObject = globalObject;
    for (const key in freshGlobalObject) globalCache[key] = global[key] || freshGlobalObject[key];
    return dbCache.set("global", globalCache);
};

const save = async (changes: string[]) => {
    dbSaveQueue.set("global", changes);
    let global = await get(), globalCache = dbCache.get("global"), globalSaveQueue = dbSaveQueue.get("global");

    for (const key of globalSaveQueue) global[key] = globalCache[key];

    return (global as any).save().then(() => {
        let newSaveQueue = dbSaveQueue.get("global");
        if (newSaveQueue.length > globalSaveQueue.length) {
            dbSaveQueue.delete("global");
            save(newSaveQueue.filter((key: string) => !globalSaveQueue.includes(key)));
        } else dbSaveQueue.delete("global");
    }).catch((e: any) => void clientLogger.error(inspect(e)));
};

export default () => (async () => {
    if (!dbCache.has("global")) await load();
    return {
        reload: () => load(),
        unload: () => dbCache.delete("global"),

        get: () => Object.assign({}, dbCache.get("global")),
        set: (key: string, value: string | number | object) => {
            dbCache.get("global")[key] = value;
            save([key]);

            return dbCache.get("global");
        },
        setMultiple: (changes: string[]) => {
            let globalCache = dbCache.get("global");
            Object.assign(globalCache, changes);

            save(Object.keys(changes));

            return dbCache.get("global");
        },
        addToArray: (array: string, value: string | number | object | boolean) => {
            dbCache.get("global")[array].push(value);
            save([array]);

            return dbCache.get("global");
        },
        removeFromArray: (array: string, value: string | number | object | boolean) => {
            dbCache.get("global")[array] = dbCache.get("global")[array].filter((aValue: string | number | object | boolean) => aValue !== value);
            save([array]);

            return dbCache.get("global");
        },
        setOnObject: (object: string, key: string, value: string | number | object | boolean) => {
            dbCache.get("global")[object][key] = value;
            save([object]);

            return dbCache.get("global");
        },
        removeFromObject: (object: string, key: string) => {
            delete dbCache.get("global")[object][key];
            save([object]);

            return dbCache.get("global");
        },
        reset: () => {
            let globalCache = dbCache.get("global");
            Object.assign(globalCache, globalObject);

            save(Object.keys(globalObject));

            return dbCache.get("global");
        }
    };
});