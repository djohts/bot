module.exports = {
    aliases: ["execute", "ex"],
    permissionRequired: 5,
    checkArgs: (args) => !!args.length
};

const { exec } = require("child_process");

module.exports.run = (message, args) => {
    exec(args.join(" "), (error, stdout) => {
        let res = (error || stdout);
        message.channel.send(`\`\`\`${res}\`\`\``);
    });
};