export const options = { name: "eval" };

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from "discord.js";
import { exec } from "node:child_process";

export const run = async (message: Message<true>) => {
    const script = message.content.slice(27);

    exec(script, (error, stdout) => {
        return message.reply({
            content: `\`\`\`\n${(error ?? stdout).toString().slice(0, 1990)}\n\`\`\``,
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents(
                    new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                )
            ]
        });
    });
};