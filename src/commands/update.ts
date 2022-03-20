import { CommandInteraction, Message, MessageActionRow, MessageButton } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { exec } from "child_process";

export const options = new SlashCommandBuilder()
    .setName("update")
    .setDescription("Pull latest updates from GitHub.")
    .toJSON();
export const permission = 5;

export async function run(interaction: CommandInteraction) {
    exec("git stash push --include-untracked");
    exec("git pull", (error, stdout) => {
        exec("git stash drop");
        if (error) return interaction.reply(`\`\`\`fix\n${error}\n\`\`\``);

        if (stdout.includes("Already up to date.")) {
            interaction.reply({
                content: "Bot already up to date. No changes since last pull.",
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton().setLabel("🗑️").setStyle("DANGER").setCustomId("reply:delete")
                    ])
                ]
            });
        } else {
            console.log(`Pulled from GitHub by ${interaction.user.tag}. Rebooting all shards.\n\n` + stdout);
            interaction.reply({
                content: "Pulled from GitHub. Rebooting all shards.\n\nLogs:\n```\n" + stdout.slice(0, 1947) + "\n```",
                fetchReply: true,
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton().setLabel("🗑️").setStyle("DANGER").setCustomId("reply:delete")
                    ])
                ]
            }).then(async (i: Message) => {
                i.react("♻️").then(() => interaction.client.shard.broadcastEval(() => process.exit()));
            });
        };
    });
};