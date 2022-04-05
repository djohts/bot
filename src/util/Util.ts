import { ModifiedClient } from "../constants/types";
import { inspect } from "util";

let util: Util | null = null;

class Util {
    constructor() {
        if (util) return util;
        util = this;
    };

    private _client: ModifiedClient;
    private _database: typeof import("../database/");
    public static inspect = inspect;

    public setClient(client: ModifiedClient): Util {
        this._client = client;
        return this;
    };

    public setDatabase(database: typeof import("../database/")): Util {
        this._database = database;
        return this;
    };

    get client() {
        return this._client;
    };
    get database() {
        return this._database;
    };
};

export = new Util;