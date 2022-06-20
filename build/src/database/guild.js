"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheGuilds = void 0;
const mongoose_1 = require("mongoose");
const time_1 = require("../constants/time");
const dbCache = new Map(), dbSaveQueue = new Map();
const guildObject = {
    guildid: "",
    voices: {},
    bans: {},
    channel: "",
    count: 0,
    user: "",
    modules: [],
    flows: {},
    message: "",
    users: {},
    liveboard: {},
    log: {},
    brcs: {},
    brms: {},
    brs: {},
    statschannels: {}
};
const guildSchema = new mongoose_1.Schema(guildObject, { minimize: true });
const Guild = (0, mongoose_1.model)("Guild", guildSchema);
const get = (guildid) => new Promise((resolve, reject) => Guild.findOne({ guildid }, (err, guild) => {
    if (err)
        return reject(err);
    if (!guild) {
        guild = new Guild(guildObject);
        guild.guildid = guildid;
    }
    ;
    return resolve(guild);
}));
const load = async (guildid) => {
    const guild = await get(guildid), guildCache = {}, freshGuildObject = guildObject;
    for (const key in freshGuildObject)
        guildCache[key] = guild[key] || freshGuildObject[key];
    return dbCache.set(guildid, guildCache);
};
const save = async (guildid, changes) => {
    if (!dbSaveQueue.has(guildid)) {
        dbSaveQueue.set(guildid, changes);
        const guild = await get(guildid), guildCache = dbCache.get(guildid), guildSaveQueue = dbSaveQueue.get(guildid);
        for (const key of guildSaveQueue)
            guild[key] = guildCache[key];
        return guild.save().then(() => {
            let newSaveQueue = dbSaveQueue.get(guildid);
            if (newSaveQueue.length > guildSaveQueue.length) {
                dbSaveQueue.delete(guildid);
                save(guildid, newSaveQueue.filter((key) => !guildSaveQueue.includes(key)));
            }
            else
                dbSaveQueue.delete(guildid);
        }).catch(console.log);
    }
    else
        dbSaveQueue.get(guildid).push(...changes);
};
exports.default = () => (async (guildid) => {
    if (!dbCache.has(guildid))
        await load(guildid);
    return {
        reload: () => load(guildid),
        unload: () => dbCache.delete(guildid),
        get: () => Object.assign({}, dbCache.get(guildid)),
        set: (key, value) => {
            dbCache.get(guildid)[key] = value;
            save(guildid, [key]);
            return dbCache.get(guildid);
        },
        setMultiple: (changes) => {
            let guildCache = dbCache.get(guildid);
            Object.assign(guildCache, changes);
            save(guildid, Object.keys(changes));
            return dbCache.get(guildid);
        },
        addToArray: (array, value) => {
            dbCache.get(guildid)[array].push(value);
            save(guildid, [array]);
            return dbCache.get(guildid);
        },
        removeFromArray: (array, value) => {
            dbCache.get(guildid)[array] = dbCache.get(guildid)[array].filter((aValue) => aValue !== value);
            save(guildid, [array]);
            return dbCache.get(guildid);
        },
        setOnObject: (object, key, value) => {
            dbCache.get(guildid)[object][key] = value;
            save(guildid, [object]);
            return dbCache.get(guildid);
        },
        removeFromObject: (object, key) => {
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
        addToCount: (member) => {
            let guildCache = dbCache.get(guildid);
            guildCache.count++;
            guildCache.user = member.id;
            if (!guildCache.users[member.id])
                guildCache.users[member.id] = 0;
            guildCache.users[member.id]++;
            let dateFormat = (0, time_1.getDateFormatted)(new Date());
            if (!guildCache.log[dateFormat]) {
                guildCache.log[dateFormat] = 0;
                while (Object.keys(guildCache.log).length > 7)
                    delete guildCache.log[Object.keys(guildCache.log)[0]];
            }
            ;
            guildCache.log[dateFormat] += 1;
            save(guildid, ["count", "user", "users", "log", "message"]);
            return dbCache.get(guildid);
        }
    };
});
async function cacheGuilds(guilds) {
    let gdbs = await Guild.find({ $or: [...guilds].map((guildid) => ({ guildid })) });
    return await Promise.all([...guilds].map(async (guildid) => {
        const guild = gdbs.find((db) => db.guildid == guildid) || { guildid };
        const guildCache = {};
        const freshGuildObject = guildObject;
        for (const key in freshGuildObject)
            guildCache[key] = guild[key] || freshGuildObject[key];
        return dbCache.set(guildid, guildCache);
    }));
}
exports.cacheGuilds = cacheGuilds;
;
