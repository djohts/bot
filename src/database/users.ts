import { Schema, model } from "mongoose";
import { Subscription, UserObject } from "../constants/types";
import { isEqual } from "lodash";

const dbCache = new Map<string, UserObject>(), dbSaveQueue = new Map<string, string[]>();

const userObject = {
    userid: "",
    subscriptions: []
} as UserObject;

const userSchema = new Schema(userObject, { minimize: true });
const User = model<UserObject>("User", userSchema);

const get = (userid: string) => new Promise((resolve, reject) => User.findOne({ userid }, (err: Error, user: any) => {
    if (err) return reject(err);
    if (!user) {
        user = new User(userObject);
        user.userid = userid;
    };
    return resolve(user);
}));

const load = async (userid: string) => {
    const user = await get(userid), userCache = {} as UserObject, freshUserObject = userObject;
    for (const key in freshUserObject) userCache[key] = user[key] || freshUserObject[key];
    return dbCache.set(userid, userCache);
};

const save = async (userid: string, changes: string[]) => {
    if (!dbSaveQueue.has(userid)) {
        dbSaveQueue.set(userid, changes);
        const user = await get(userid), userCache = dbCache.get(userid), userSaveQueue = dbSaveQueue.get(userid);
        for (const key of userSaveQueue) user[key] = userCache[key];
        return (user as any).save().then(() => {
            let newSaveQueue = dbSaveQueue.get(userid);
            if (newSaveQueue.length > userSaveQueue.length) {
                dbSaveQueue.delete(userid);
                save(userid, newSaveQueue.filter((key: string) => !userSaveQueue.includes(key)));
            } else dbSaveQueue.delete(userid);
        }).catch(console.log);
    } else dbSaveQueue.get(userid).push(...changes);
};

export default () => (async (userid: string) => {
    if (!dbCache.has(userid)) await load(userid);
    return {
        reload: () => load(userid),
        unload: () => dbCache.delete(userid),

        get: () => Object.assign({}, dbCache.get(userid)),
        set: (key: string, value: string | number | object | boolean) => {
            dbCache.get(userid)[key] = value;
            save(userid, [key]);

            return dbCache.get(userid);
        },
        setMultiple: (changes: object) => {
            let userCache = dbCache.get(userid);
            Object.assign(userCache, changes);

            save(userid, Object.keys(changes));

            return dbCache.get(userid);
        },
        addToArray: (array: string, value: string | number | object | boolean) => {
            dbCache.get(userid)[array].push(value);
            save(userid, [array]);

            return dbCache.get(userid);
        },
        removeFromArray: (array: string, value: string | number | object | boolean) => {
            dbCache.get(userid)[array] = dbCache.get(userid)[array].filter((aValue: string | number | object | boolean) => !isEqual(aValue, value));
            save(userid, [array]);

            return dbCache.get(userid);
        },
        setOnObject: (object: string, key: string, value: string | number | object | boolean) => {
            dbCache.get(userid)[object][key] = value;
            save(userid, [object]);

            return dbCache.get(userid);
        },
        removeFromObject: (object: string, key: string) => {
            delete dbCache.get(userid)[object][key];
            save(userid, [object]);

            return dbCache.get(userid);
        },
        subscribe: (a: Subscription) => {
            dbCache.get(userid).subscriptions.push(a);
            save(userid, ["subscriptions"]);

            return dbCache.get(userid);
        },
        unsubscribe: (a: Subscription) => {
            dbCache.get(userid).subscriptions = dbCache.get(userid).subscriptions.filter((b) => !isEqual(b, a));
            save(userid, ["subscriptions"]);

            return dbCache.get(userid);
        },
        isSubscribed: (a: Subscription) => dbCache.get(userid).subscriptions.some((b) => isEqual(b, a)),
        reset: () => {
            let userCache = dbCache.get(userid);
            Object.assign(userCache, userObject);
            userCache.userid = userid;

            save(userid, Object.keys(userObject));

            return dbCache.get(userid);
        }
    };
});