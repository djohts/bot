import { GuildObject, Warn } from "../../types";
import { getDateFormatted } from "../constants/time";
import { clientLogger } from "../util/logger/normal";
import { generateID } from "../constants";
import { Schema, model } from "mongoose";
import { GuildMember } from "discord.js";
import { isEqual } from "lodash";
import { inspect } from "util";

const dbCache = new Map<string, GuildObject>(), dbSaveQueue = new Map<string, string[]>();

const guildObject = {
    guildid: "",
    locale: "",
    voices: {},
    // moderation data
    bans: {},
    warns: [],
    // counting
    channel: "",
    count: 0,
    user: "",
    modules: [],
    message: "",
    users: {},
    // buttonroles
    brcs: {},
    brms: {},
    brs: {},
    // serverstats
    statschannels: {}
} as GuildObject;

const guildSchema = new Schema(guildObject, { minimize: true });
const Guild = model("Guild", guildSchema);

const get = (guildid: string): Promise<Error | GuildObject> => new Promise((resolve, reject) => Guild.findOne({ guildid }, (err: Error, guild: GuildObject) => {
    if (err) return reject(err);
    if (!guild) {
        guild = new Guild(guildObject);
        guild.guildid = guildid;
    };
    return resolve(guild);
}));

const load = async (guildid: string) => {
    const guild = await get(guildid), guildCache = {} as GuildObject, freshGuildObject = guildObject;
    for (const key in freshGuildObject) guildCache[key] = guild[key] ?? freshGuildObject[key];
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

type ValueType = string | number | object | boolean;
let timeout: ReturnType<typeof setTimeout> | null = null;
export default () => (async (guildid: string) => {
    if (!dbCache.has(guildid)) await load(guildid);
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
        if (dbSaveQueue.has(guildid)) save(guildid, dbSaveQueue.get(guildid)).then(() => dbCache.delete(guildid));
    }, 5 * 60 * 1000);
    return {
        reload: () => load(guildid),
        unload: () => dbCache.delete(guildid),

        get: () => Object.assign({}, dbCache.get(guildid)),
        set: (key: string, value: ValueType) => {
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
        addToArray: (array: string, value: ValueType) => {
            dbCache.get(guildid)[array].push(value);
            save(guildid, [array]);

            return dbCache.get(guildid);
        },
        removeFromArray: (array: string, value: ValueType) => {
            dbCache.get(guildid)[array] = dbCache.get(guildid)[array].filter((aValue: ValueType) => !isEqual(aValue, value));
            save(guildid, [array]);

            return dbCache.get(guildid);
        },
        setOnObject: (object: string, key: string, value: ValueType) => {
            dbCache.get(guildid)[object][key] = value;
            save(guildid, [object]);

            return dbCache.get(guildid);
        },
        removeFromObject: (object: string, key: string) => {
            delete dbCache.get(guildid)[object][key];
            save(guildid, [object]);

            return dbCache.get(guildid);
        },
        addWarn: (userId: string, actionedById: string, reason?: string) => {
            const warn: Warn = {
                id: generateID(4),
                timestamp: Date.now(),
                userId,
                actionedById
            };

            if (reason) warn.reason = reason;

            dbCache.get(guildid).warns.push(warn);
            save(guildid, ["warns"]);

            return dbCache.get(guildid);
        },
        removeWarn: (id: string) => {
            dbCache.get(guildid).warns = dbCache.get(guildid).warns.filter((warn) => warn.id !== id);
            save(guildid, ["warns"]);

            return dbCache.get(guildid);
        },
        reset: () => {
            let guildCache = dbCache.get(guildid);
            Object.assign(guildCache, guildObject);
            guildCache.guildid = guildid;

            save(guildid, Object.keys(guildObject));

            return dbCache.get(guildid);
        },
        addToCount: (member: GuildMember) => {
            let guildCache = dbCache.get(guildid);
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

            save(guildid, ["count", "user", "users", "log", "message"]);

            return dbCache.get(guildid);
        }
    };
});

export async function cacheGuilds(guilds: Set<string>) {
    const gdbs = await Guild.find({ $or: [...guilds].map((guildid) => ({ guildid })) });
    return [...guilds].map((guildid) => {
        const guild = gdbs.find((db) => db.guildid === guildid) || { guildid };
        const guildCache = {} as GuildObject;
        const freshGuildObject = guildObject;

        for (const key in freshGuildObject) guildCache[key] = guild[key] ?? freshGuildObject[key];

        return dbCache.set(guildid, guildCache);
    });
};