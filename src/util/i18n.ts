import { readdirSync } from "node:fs";
import I18n from "@eartharoid/i18n";

const localesObject = {};

for (const file of readdirSync(__dirname + "/../../locales").filter(file => file.endsWith(".json"))) {
    const locale = file.split(".")[0];
    localesObject[locale] = require(`../../locales/${file}`);
};

export = new I18n("en", localesObject);