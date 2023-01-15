import { join } from "path";
import i18next from "i18next";
import fs from "fs";

function readLocales(dir: string, obj: Record<string, any> = {}) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const needsTranslation = file.match(/(en|ua|ru)$/g);
        const filePath = `${dir}/${file}`;
        const stat = fs.lstatSync(filePath);
        if (stat.isDirectory()) {
            obj[file] = {};
            if (needsTranslation) {
                obj[file].translation = {};
                readLocales(filePath, obj[file].translation);
            } else {
                readLocales(filePath, obj[file]);
            }
        } else {
            obj[file.replace(".json", "")] = require(filePath);
        }
    });
    return obj;
};

i18next.init({
    fallbackLng: "en",
    returnNull: false,
    returnEmptyString: false,
    resources: readLocales(join(__dirname, "..", "..", "locales")),
    interpolation: {
        escapeValue: false
    }
});

declare module "i18next" {
    interface CustomTypeOptions {
        resources: Record<string, string>;
        returnNull: false;
    }
};