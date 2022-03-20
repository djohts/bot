"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const discord_js_1 = require("discord.js");
const builders_1 = require("@discordjs/builders");
const child_process_1 = require("child_process");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("update")
    .setDescription("Pull latest updates from GitHub.")
    .toJSON();
exports.permission = 5;
async function run(interaction) {
    (0, child_process_1.exec)("git stash push --include-untracked");
    (0, child_process_1.exec)("git pull", (error, stdout) => {
        (0, child_process_1.exec)("git stash drop");
        if (error)
            return interaction.reply(`\`\`\`fix\n${error}\n\`\`\``);
        if (stdout.includes("Already up to date.")) {
            interaction.reply({
                content: "Bot already up to date. No changes since last pull.",
                components: [
                    new discord_js_1.MessageActionRow().addComponents([
                        new discord_js_1.MessageButton().setLabel("🗑️").setStyle("DANGER").setCustomId("reply:delete")
                    ])
                ]
            });
        }
        else {
            console.log(`Pulled from GitHub by ${interaction.user.tag}. Rebooting all shards.\n\n` + stdout);
            interaction.reply({
                content: "Pulled from GitHub. Rebooting all shards.\n\nLogs:\n```\n" + stdout.slice(0, 1947) + "\n```",
                fetchReply: true,
                components: [
                    new discord_js_1.MessageActionRow().addComponents([
                        new discord_js_1.MessageButton().setLabel("🗑️").setStyle("DANGER").setCustomId("reply:delete")
                    ])
                ]
            }).then(async (i) => {
                i.react("♻️").then(() => interaction.client.shard.broadcastEval(() => process.exit()));
            });
        }
        ;
    });
}
exports.run = run;
;
