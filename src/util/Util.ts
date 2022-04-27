import { ModifiedClient } from "../constants/types";
import { inspect } from "util";
import { Manager } from "erela.js";

let util: Util | null = null;

class Util {
    constructor() {
        if (util) return util;
        util = this;
    };

    private _client: ModifiedClient | null;
    private _database: typeof import("../database/") | null;
    private _lavaManager: Manager | null;
    public static inspect = inspect;

    public setClient(client: ModifiedClient): Util {
        this._client = client;
        return this;
    };

    public setDatabase(database: typeof import("../database/")): Util {
        this._database = database;
        return this;
    };

    public setLavaManager(lavaManager: Manager): Util {
        this._lavaManager = lavaManager;
        return this;
    };

    get client() {
        return this._client;
    };
    get database() {
        return this._database;
    };
    get lava() {
        return this._lavaManager;
    };
};

export = new Util;