"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const util_1 = require("util");
const string_progressbar_1 = require("string-progressbar");
const pretty_ms_1 = __importDefault(require("pretty-ms"));
let util = null;
class Util {
    constructor() {
        Object.defineProperty(this, "_client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "_database", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "_lavaManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "inspect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: util_1.inspect
        });
        Object.defineProperty(this, "wait", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (ms) => new Promise((resolve) => setTimeout(resolve, ms))
        });
        Object.defineProperty(this, "prettyBytes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (bytes, { maximumFractionDigits = 2 }) => {
                const suffixes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
                let i = 0;
                while (bytes >= 1024) {
                    bytes /= 1024;
                    i++;
                }
                ;
                return `${bytes.toFixed(maximumFractionDigits)} ${suffixes[i]}`;
            }
        });
        Object.defineProperty(this, "func", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                tickMusicPlayers: async (player) => {
                    try {
                        const track = player.queue.current;
                        const message = player.get("message");
                        if (!track || !message || !message.editable)
                            return;
                        const duration = Math.floor(track.duration / 1000) * 1000;
                        const position = Math.floor(player.position / 1000) * 1000;
                        const progressComponent = [
                            (0, string_progressbar_1.splitBar)(duration, position, 20)[0],
                            ` [`,
                            (0, pretty_ms_1.default)(position, { colonNotation: true, compact: true }),
                            ` / `,
                            (0, pretty_ms_1.default)(duration, { colonNotation: true, compact: true }),
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
                    catch {
                        return;
                    }
                    ;
                }
            }
        });
        if (util)
            return util;
        util = this;
    }
    ;
    setClient(client) {
        import("discord-logs").then((x) => x.default(client));
        client.util = this;
        this._client = client;
        return this;
    }
    ;
    setDatabase(database) {
        this._database = database;
        return this;
    }
    ;
    setLavaManager(lavaManager) {
        this._lavaManager = lavaManager;
        return this;
    }
    ;
    get client() {
        return this._client;
    }
    ;
    get database() {
        return this._database;
    }
    ;
    get lava() {
        return this._lavaManager;
    }
    ;
}
;
module.exports = new Util;
