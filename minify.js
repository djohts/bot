const fs = require('fs');
const terser = require('terser');
const recursive = require('recursive-readdir-synchronous');

Promise.all(recursive("./build/").map(async (file) => {
    if (file.match(/\.js(on)?$/i)) {
        console.log(`minifying ${file} ...`);
        await terser.minify(fs.readFileSync(file, { encoding: "utf-8" }), { mangle: true, compress: true }).then((output) => {
            fs.writeFileSync(file, output.code);
        });
    };
})).then(() => {
    console.log("minified!");
    process.exit();
});