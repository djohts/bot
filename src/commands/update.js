module.exports = {
    aliases: ["upd", "u"],
    permissionRequired: 5,
    checkArgs: (args) => !args.length
};

const { exec } = require("child_process");

module.exports.run = async (message) => {
    exec("git stash push --include-untracked");
    exec("git pull", (error, stdout) => {
        exec("git stash drop");
        if (error) return message.reply(`\`\`\`fix\n${error}\n\`\`\``);

        if (stdout.includes("Already up to date.")) {
            message.reply("Bot already up to date. No changes since last pull.");
        } else {
            message.reply("Pulled from GitHub. Restarting the bot.\n\nLogs:\n```\n" + res + "\n```")
                .then(() => setTimeout(() => process.exit(), 1000));
        };
    });
};