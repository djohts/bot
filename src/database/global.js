const { Schema, model } = require("mongoose");

const dbCache = new Map(), dbSaveQueue = new Map();

const globalObject = {
    maintenance: false
};

const globalSchema = Schema(JSON.parse(JSON.stringify(globalObject)), { minimize: true });
const Global = model("Global", globalSchema);
global.Global = Global;

const get = () => new Promise((resolve, reject) => Global.findOne({}, (err, global) => {
    if (err) return reject(err);
    if (!global) {
        global = new Global(JSON.parse(JSON.stringify(globalObject)));
    };
    return resolve(global);
}));

const load = async () => {
    let global = await get(), globalCache = {}, freshGlobalObject = JSON.parse(JSON.stringify(globalObject));

    for (const key in freshGlobalObject) globalCache[key] = global[key] || freshGlobalObject[key];

    return dbCache.set("global", globalCache);
};

const save = async (changes) => {
    dbSaveQueue.set("global", changes);
    let global = await get(), globalCache = dbCache.get("global"), globalSaveQueue = JSON.parse(JSON.stringify(dbSaveQueue.get("global")));

    for (const key of globalSaveQueue) global[key] = globalCache[key];

    return global.save().then(() => {
        let newSaveQueue = dbSaveQueue.get("global");
        if (newSaveQueue.length > globalSaveQueue.length) {
            dbSaveQueue.delete("global");
            save(newSaveQueue.filter(key => !globalSaveQueue.includes(key)));
        } else dbSaveQueue.delete("global");
    }).catch(console.log);
};

if (!dbCache.has("global")) (async () => await load())();

module.exports = {
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
        dbCache.get("global")[array] = dbCache.get("global")[array].filter(aValue => aValue !== value);
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