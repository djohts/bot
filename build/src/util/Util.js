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
        this.inspect = util_1.inspect;
        this.wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        this.func = {
            updatePlayerMessage: async (player) => {
                const track = player.queue.current;
                let message = player.get("message");
                if (!message || !message.editable)
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
        };
        if (util)
            return util;
        util = this;
    }
    ;
    setClient(client) {
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
