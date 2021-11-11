const { Schema, model } = require("mongoose");
const { getDateFormatted } = require("../constants/time");

const dbCache = new Map(), dbSaveQueue = new Map();

const guildObject = {
    guildid: "",
    voices: {},
    mutes: {},
    bans: {},
    //
    channel: "",
    count: 0,
    user: "",
    modules: [],
    flows: {},
    message: "",
    users: {},
    liveboard: {},
    log: {}
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

const load = async (guildId) => {
    const guild = await get(guildId), guildCache = {}, freshGuildObject = JSON.parse(JSON.stringify(guildObject));
    for (const key in freshGuildObject) guildCache[key] = guild[key] || freshGuildObject[key];
    return dbCache.set(guildId, guildCache);
};

const save = async (guildId, changes) => {
    if (!dbSaveQueue.has(guildId)) {
        dbSaveQueue.set(guildId, changes);
        const guild = await get(guildId), guildCache = dbCache.get(guildId), guildSaveQueue = JSON.parse(JSON.stringify(dbSaveQueue.get(guildId)));
        for (const key of guildSaveQueue) guild[key] = guildCache[key];
        return guild.save().then(() => {
            let newSaveQueue = dbSaveQueue.get(guildId);
            if (newSaveQueue.length > guildSaveQueue.length) {
                dbSaveQueue.delete(guildId);
                save(guildId, newSaveQueue.filter(key => !guildSaveQueue.includes(key)));
            } else dbSaveQueue.delete(guildId);
        }).catch(console.log);
    } else dbSaveQueue.get(guildId).push(...changes);
};

module.exports = () => (async guildId => {
    if (!dbCache.has(guildId)) await load(guildId);
    return {
        reload: () => load(guildId),
        unload: () => dbCache.delete(guildId),

        get: () => Object.assign({}, dbCache.get(guildId)),
        set: (key, value) => {
            dbCache.get(guildId)[key] = value;
            save(guildId, [key]);

            return dbCache.get(guildId);
        },
        setMultiple: (changes) => {
            let guildCache = dbCache.get(guildId);
            Object.assign(guildCache, changes);

            save(guildId, Object.keys(changes));

            return dbCache.get(guildId);
        },
        addToArray: (array, value) => {
            dbCache.get(guildId)[array].push(value);
            save(guildId, [array]);

            return dbCache.get(guildId);
        },
        removeFromArray: (array, value) => {
            dbCache.get(guildId)[array] = dbCache.get(guildId)[array].filter(aValue => aValue !== value);
            save(guildId, [array]);

            return dbCache.get(guildId);
        },
        setOnObject: (object, key, value) => {
            dbCache.get(guildId)[object][key] = value;
            save(guildId, [object]);

            return dbCache.get(guildId);
        },
        removeFromObject: (object, key) => {
            delete dbCache.get(guildId)[object][key];
            save(guildId, [object]);

            return dbCache.get(guildId);
        },
        reset: () => {
            let guildCache = dbCache.get(guildId);
            Object.assign(guildCache, guildObject);
            guildCache.guildId = guildId;

            save(guildId, Object.keys(guildObject));

            return dbCache.get(guildId);
        },
        addToCount: (member) => {
            let guildCache = dbCache.get(guildId);
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

            save(guildId, ["count", "user", "users", "log"]);

            return dbCache.get(guildId);
        }
    };
});

module.exports.cacheAll = async (guilds = new Set()) => {
    let gdbs = await Guild.find({ $or: [...guilds].map(guildId => ({ guildId })) });
    return await Promise.all([...guilds].map(async (guildId) => {
        const guild = gdbs.find(db => db.guildId == guildId) || { guildId };
        const guildCache = {};
        const freshGuildObject = JSON.parse(JSON.stringify(guildObject));

        for (const key in freshGuildObject) guildCache[key] = guild[key] || freshGuildObject[key];

        return dbCache.set(guildId, guildCache);
    }));
};