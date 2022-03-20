export const propertyTypes = {
    numberX: {
        short: "Число (Х)",
        help: "Любое натуральное число.",
        convert: (num: string) => parseInt(num) || null
    }
};

for (const i in propertyTypes) propertyTypes[i] = Object.assign({
    short: "N/A",
    help: null,
    convert: (any) => any,
    format: (any) => any
}, propertyTypes[i]);