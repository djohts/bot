"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const dbCache = new Map(), dbSaveQueue = new Map();
const globalObject = {
    maintenance: false,
    debug: false,
    generatedIds: [],
    boticordBumps: []
};
const globalSchema = new mongoose_1.Schema(globalObject, { minimize: true });
const Global = (0, mongoose_1.model)("Global", globalSchema);
const get = () => new Promise((resolve, reject) => Global.findOne({}, (err, global) => {
    if (err)
        return reject(err);
    if (!global) {
        global = new Global(globalObject);
    }
    ;
    return resolve(global);
}));
const load = async () => {
    let global = await get(), globalCache = {}, freshGlobalObject = globalObject;
    for (const key in freshGlobalObject)
        globalCache[key] = global[key] || freshGlobalObject[key];
    return dbCache.set("global", globalCache);
};
const save = async (changes) => {
    dbSaveQueue.set("global", changes);
    let global = await get(), globalCache = dbCache.get("global"), globalSaveQueue = dbSaveQueue.get("global");
    for (const key of globalSaveQueue)
        global[key] = globalCache[key];
    return global.save().then(() => {
        let newSaveQueue = dbSaveQueue.get("global");
        if (newSaveQueue.length > globalSaveQueue.length) {
            dbSaveQueue.delete("global");
            save(newSaveQueue.filter((key) => !globalSaveQueue.includes(key)));
        }
        else
            dbSaveQueue.delete("global");
    }).catch(console.log);
};
exports.default = () => (async () => {
    if (!dbCache.has("global"))
        await load();
    return {
        reload: () => load(),
        unload: () => dbCache.delete("global"),
        get: () => Object.assign({}, dbCache.get("global")),
        set: (key, value) => {
            dbCache.get("global")[key] = value;
            save([key]);
            return dbCache.get("global");
        },
        setMultiple: (changes) => {
            let globalCache = dbCache.get("global");
            Object.assign(globalCache, changes);
            save(Object.keys(changes));
            return dbCache.get("global");
        },
        addToArray: (array, value) => {
            dbCache.get("global")[array].push(value);
            save([array]);
            return dbCache.get("global");
        },
        removeFromArray: (array, value) => {
            dbCache.get("global")[array] = dbCache.get("global")[array].filter((aValue) => aValue !== value);
            save([array]);
            return dbCache.get("global");
        },
        setOnObject: (object, key, value) => {
            dbCache.get("global")[object][key] = value;
            save([object]);
            return dbCache.get("global");
        },
        removeFromObject: (object, key) => {
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
