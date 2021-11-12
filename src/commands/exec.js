module.exports = {
    aliases: ["execute", "ex"],
    permissionRequired: 5,
    checkArgs: (args) => !!args.length
};

const { exec } = require("child_process");

module.exports.run = (message, args) => {
    exec(args.join(" "), (err, res) => {
        const combo = err || res;

        message.reply({
            content: "```fix\n" + combo + "\n```",
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    emoji: {
                        name: "🗑"
                    },
                    style: 4,
                    custom_id: "reply:delete"
                }]
            }]
        });
    });
};