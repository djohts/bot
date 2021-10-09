module.exports = {
    aliases: ["execute", "ex"],
    permissionRequired: 5,
    checkArgs: (args) => !!args.length
};

const { exec } = require("child_process");

module.exports.run = (message, args) => {
    exec(args.join(" "), (error, stdout) => {
        if (error) return message.reply(`${error}`);
        let res = stdout;
        message.reply({ content: "```fix\n" + res + "\n```" });
    });
};