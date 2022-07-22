"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const lodash_1 = require("lodash");
const dbCache = new Map(), dbSaveQueue = new Map();
const userObject = {
    userid: "",
    subscriptions: []
};
const userSchema = new mongoose_1.Schema(userObject, { minimize: true });
const User = (0, mongoose_1.model)("User", userSchema);
const get = (userid) => new Promise((resolve, reject) => User.findOne({ userid }, (err, user) => {
    if (err)
        return reject(err);
    if (!user) {
        user = new User(userObject);
        user.userid = userid;
    }
    ;
    return resolve(user);
}));
const load = async (userid) => {
    const user = await get(userid), userCache = {}, freshUserObject = userObject;
    for (const key in freshUserObject)
        userCache[key] = user[key] || freshUserObject[key];
    return dbCache.set(userid, userCache);
};
const save = async (userid, changes) => {
    if (!dbSaveQueue.has(userid)) {
        dbSaveQueue.set(userid, changes);
        const user = await get(userid), userCache = dbCache.get(userid), userSaveQueue = dbSaveQueue.get(userid);
        for (const key of userSaveQueue)
            user[key] = userCache[key];
        return user.save().then(() => {
            let newSaveQueue = dbSaveQueue.get(userid);
            if (newSaveQueue.length > userSaveQueue.length) {
                dbSaveQueue.delete(userid);
                save(userid, newSaveQueue.filter((key) => !userSaveQueue.includes(key)));
            }
            else
                dbSaveQueue.delete(userid);
        }).catch(console.log);
    }
    else
        dbSaveQueue.get(userid).push(...changes);
};
exports.default = () => (async (userid) => {
    if (!dbCache.has(userid))
        await load(userid);
    return {
        reload: () => load(userid),
        unload: () => dbCache.delete(userid),
        get: () => Object.assign({}, dbCache.get(userid)),
        set: (key, value) => {
            dbCache.get(userid)[key] = value;
            save(userid, [key]);
            return dbCache.get(userid);
        },
        setMultiple: (changes) => {
            let userCache = dbCache.get(userid);
            Object.assign(userCache, changes);
            save(userid, Object.keys(changes));
            return dbCache.get(userid);
        },
        addToArray: (array, value) => {
            dbCache.get(userid)[array].push(value);
            save(userid, [array]);
            return dbCache.get(userid);
        },
        removeFromArray: (array, value) => {
            dbCache.get(userid)[array] = dbCache.get(userid)[array].filter((aValue) => !(0, lodash_1.isEqual)(aValue, value));
            save(userid, [array]);
            return dbCache.get(userid);
        },
        setOnObject: (object, key, value) => {
            dbCache.get(userid)[object][key] = value;
            save(userid, [object]);
            return dbCache.get(userid);
        },
        removeFromObject: (object, key) => {
            delete dbCache.get(userid)[object][key];
            save(userid, [object]);
            return dbCache.get(userid);
        },
        subscribe: (a) => {
            dbCache.get(userid).subscriptions.push(a);
            save(userid, ["subscriptions"]);
            return dbCache.get(userid);
        },
        unsubscribe: (a) => {
            dbCache.get(userid).subscriptions = dbCache.get(userid).subscriptions.filter((b) => !(0, lodash_1.isEqual)(b, a));
            save(userid, ["subscriptions"]);
            return dbCache.get(userid);
        },
        isSubscribed: (a) => dbCache.get(userid).subscriptions.some((b) => (0, lodash_1.isEqual)(b, a)),
        reset: () => {
            let userCache = dbCache.get(userid);
            Object.assign(userCache, userObject);
            userCache.userid = userid;
            save(userid, Object.keys(userObject));
            return dbCache.get(userid);
        }
    };
});
