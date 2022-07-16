"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const i18n_1 = __importDefault(require("@eartharoid/i18n"));
const fs_1 = require("fs");
const localesObject = {};
for (const file of (0, fs_1.readdirSync)(__dirname + "/../locales").filter(file => file.endsWith(".json"))) {
    const locale = file.split(".")[0];
    localesObject[locale] = require(`../locales/${file}`);
}
;
module.exports = new i18n_1.default("en", localesObject);
