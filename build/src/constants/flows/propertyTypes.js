"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyTypes = void 0;
exports.propertyTypes = {
    numberX: {
        short: "Число (Х)",
        help: "Любое натуральное число.",
        convert: (num) => parseInt(num) || null
    }
};
for (const i in exports.propertyTypes)
    exports.propertyTypes[i] = Object.assign({
        short: "N/A",
        help: null,
        convert: (any) => any,
        format: (any) => any
    }, exports.propertyTypes[i]);
