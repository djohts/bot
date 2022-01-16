module.exports = {
    aliases: ["ev"],
    permissionRequired: 5,
    checkArgs: (args) => !!args.length
};

const { Message } = require("discord.js");

module.exports.run = async (message, args = [""]) => {
    if (!(message instanceof Message)) return;

    let content = args.join(" ");
    try {
        let evaled = await eval(content);
        if (typeof evaled != "string") evaled = require("util").inspect(evaled);

        message.reply({
            content: `\`\`\`\`js\n${evaled}\n\`\`\``,
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
        }).catch(() => message.react("✅").catch(() => false));
    } catch (e) {
        let err;
        if (typeof e == "string") err = e.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
        else err = e;

        message.reply({
            content: `\`\`\`\`fix\n${err}\n\`\`\``,
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    emoji: {
                        id: null,
                        name: "🗑"
                    },
                    style: 4,
                    custom_id: "reply:delete"
                }]
            }]
        }).catch(() => message.react("✅").catch(() => false));
    };
};