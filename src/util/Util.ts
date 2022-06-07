import { ModifiedClient } from "../constants/types";
import { inspect } from "util";
import { Manager, Player } from "erela.js";
import { Message } from "discord.js";
import { splitBar } from "string-progressbar";
import prettyms from "pretty-ms";

let util: Util | null = null;

class Util {
    constructor() {
        if (util) return util;
        util = this;
    };

    private _client: ModifiedClient | null;
    private _database: typeof import("../database/") | null;
    private _lavaManager: Manager | null;
    public inspect = inspect;
    public wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
    public func = {
        updatePlayerMessage: async (player: Player) => {
            const track = player.queue.current;
            let message = player.get("message") as Message | undefined;
            if (!message || !message.editable) return;

            const duration = Math.floor(track.duration / 1000) * 1000;
            const position = Math.floor(player.position / 1000) * 1000;
            const progressComponent = [
                splitBar(duration, position, 20)[0],
                ` [`,
                prettyms(position, { colonNotation: true, compact: true }),
                ` / `,
                prettyms(duration, { colonNotation: true, compact: true }),
                `]`
            ].join("");
            await message.edit({
                content: null,
                embeds: [{
                    title: track.title,
                    url: track.uri,
                    thumbnail: {
                        url: track.thumbnail
                    },
                    fields: [{
                        name: "Автор",
                        value: track.author,
                        inline: true
                    }, {
                        name: "Прогресс",
                        value: progressComponent,
                    }]
                }]
            });
        }
    }

    public setClient(client: ModifiedClient): Util {
        client.util = this;
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