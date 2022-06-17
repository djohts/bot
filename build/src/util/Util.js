"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const util_1 = require("util");
const string_progressbar_1 = require("string-progressbar");
const pretty_ms_1 = __importDefault(require("pretty-ms"));
let util = null;
class Util {
    constructor() {
        if (util)
            return util;
        util = this;
    }
    ;
    _client = null;
    _database = null;
    _lavaManager = null;
    inspect = util_1.inspect;
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    prettyBytes = (bytes, { maximumFractionDigits = 2 }) => {
        const suffixes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        let i = 0;
        while (bytes >= 1024) {
            bytes /= 1024;
            i++;
        }
        ;
        return `${bytes.toFixed(maximumFractionDigits)} ${suffixes[i]}`;
    };
    func = {
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
                return await message.edit({
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
    };
    setClient(client) {
        Promise.resolve().then(() => __importStar(require("discord-logs"))).then((x) => x.default(client));
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
