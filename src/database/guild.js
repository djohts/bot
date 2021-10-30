const { Schema, model } = require("mongoose");

const dbCache = new Map(), dbSaveQueue = new Map();

const guildObject = {
    guildid: String(),
    voices: Object(),
    mutes: Object(),
    bans: Object(),
    //
    channel: String(),
    count: Number(),
    user: String(),
    modules: ["RECOVER"],
    flows: Object(),
    message: String(),
    users: Object(),
    liveboard: Object(),
    log: Object()
};

const guildSchema = Schema(JSON.parse(JSON.stringify(guildObject)), { minimize: true });
const Guild = model("Guild", guildSchema);
global.Guild = Guild;

const get = (guildId) => new Promise((resolve, reject) => Guild.findOne({ guildId }, (err, guild) => {
    if (err) return reject(err);
    if (!guild) {
        guild = new Guild(JSON.parse(JSON.stringify(guildObject)));
        guild.guildid = guildId;
    };
    return resolve(guild);
}));

const load = async (guildid) => {
    const guild = await get(guildid), guildCache = {}, freshGuildObject = JSON.parse(JSON.stringify(guildObject));
    for (const key in freshGuildObject) guildCache[key] = guild[key] || freshGuildObject[key];
    return dbCache.set(guildid, guildCache);
};

const save = async (guildid, changes) => {
    if (!dbSaveQueue.has(guildid)) {
        dbSaveQueue.set(guildid, changes);
        const guild = await get(guildid), guildCache = dbCache.get(guildid), guildSaveQueue = JSON.parse(JSON.stringify(dbSaveQueue.get(guildid)));
        for (const key of guildSaveQueue) guild[key] = guildCache[key];
        return guild.save().then(() => {
            let newSaveQueue = dbSaveQueue.get(guildid);
            if (newSaveQueue.length > guildSaveQueue.length) {
                dbSaveQueue.delete(guildid);
                save(guildid, newSaveQueue.filter(key => !guildSaveQueue.includes(key)));
            } else dbSaveQueue.delete(guildid);
        }).catch(console.log);
    } else dbSaveQueue.get(guildid).push(...changes);
};

module.exports = () => (async guildid => {
    if (!dbCache.has(guildid)) await load(guildid);
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
            dbCache.get(guildid)[array] = dbCache.get(guildid)[array].filter(aValue => aValue !== value);
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
        }
    };
});

module.exports.cacheAll = async (guilds = new Set()) => {
    let gdbs = await Guild.find({ $or: [...guilds].map(guildid => ({ guildid })) });
    return await Promise.all([...guilds].map(async guildid => {
        const guild = gdbs.find(db => db.guildid == guildid) || { guildid };
        const guildCache = {};
        const freshGuildObject = JSON.parse(JSON.stringify(guildObject));

        for (const key in freshGuildObject) guildCache[key] = guild[key] || freshGuildObject[key];

        return dbCache.set(guildid, guildCache);
    }));
};