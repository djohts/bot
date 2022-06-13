"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifiedClient = void 0;
const discord_js_1 = require("discord.js");
class ModifiedClient extends discord_js_1.Client {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "loading", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cfg", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "util", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
exports.ModifiedClient = ModifiedClient;
