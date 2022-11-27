import { join } from "path";
import i18next from "i18next";
import fs from "fs";

const loadLocales = () => {
    const localesPath = `${__dirname}/../../locales-new/`;
    const obj = {};
    const dirs = fs.readdirSync(localesPath);

    for (const dir of dirs) {
        obj[dir] = { translation: {} };

        if (fs.lstatSync(join(localesPath, dir)).isDirectory()) {
            const dirs = fs.readdirSync(join(localesPath, dir));

            for (const subdir of dirs) {
                if (fs.lstatSync(join(localesPath, dir, subdir)).isDirectory()) {
                    obj[dir]["translation"][subdir] = {};
                    const files = fs.readdirSync(join(localesPath, dir, subdir));

                    for (const file of files) {
                        const name = file.split(".")[0];
                        const content = fs.readFileSync(`${join(localesPath, dir, subdir)}/${file}`, { encoding: "utf-8" });
                        const json = JSON.parse(content);

                        obj[dir]["translation"][subdir][name] = json;
                    };
                };
            };
        };
    };

    return obj;
};

i18next.init({
    fallbackLng: "en",
    returnNull: false,
    returnEmptyString: false,
    resources: loadLocales(),
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