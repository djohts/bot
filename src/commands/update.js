module.exports = {
    name: "update",
    permissionRequired: 5,
    slash: true
};

const { exec } = require("child_process");
const { Interaction } = require("discord.js");

module.exports.run = async (interaction = new Interaction) => {
    exec("git stash push --include-untracked");
    exec("git pull", (error, stdout) => {
        exec("git stash drop");
        if (error) return interaction.reply(`\`\`\`fix\n${error}\n\`\`\``);

        if (stdout.includes("Already up to date.")) {
            interaction.reply("Bot already up to date. No changes since last pull.");
        } else {
            interaction.reply("Pulled from GitHub. Restarting the bot.\n\nLogs:\n```\n" + stdout + "\n```")
                .then(() => setTimeout(() => process.exit(), 1000));
        };
    });
};