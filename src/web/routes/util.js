const fs = require("fs");

module.exports = (fastify, _, done) => {
    fastify.get("/:file", async (req, res) => {
        if (req.params.file?.startsWith(".")) return res.status(406).send();

        const stream = fs.createReadStream(__dirname + "/../views/util/" + req.params.file);
        res.send(stream);
    });
    done();
};