module.exports = {
    aliases: ["execute", "ex"],
    permissionRequired: 5, // 0 All, 1 Admins, 2 Server Owner, 3 Bot Admin, 4 Bot Owner
    checkArgs: (args) => !!args.length
};

const { exec } = require("child_process");

module.exports.run = (message, args) => {
    exec(args.join(" "), (error, stdout) => {
        let res = (error || stdout);
        message.channel.send(`\`\`\`${res}\`\`\``, { split: true });
    });
};