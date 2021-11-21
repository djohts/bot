module.exports.propertyTypes = {
    numberX: {
        short: "Число (Х)",
        help: "Любое натуральное число.",
        convert: (num) => parseInt(num) || null
    }
};

for (const i in module.exports.propertyTypes) module.exports.propertyTypes[i] = Object.assign({
    short: "N/A",
    help: null,
    convert: (any) => any,
    format: (any) => any
}, module.exports.propertyTypes[i]);