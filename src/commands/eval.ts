export const options = { name: "eval" };

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from "discord.js";
import { getGuildDocument } from "../database";
import { inspect } from "util";
import _Util from "../util/Util";

export const run = async (message: Message) => {
    try {
        const script = message.content.slice(27);
        const Util = _Util;
        const gdb = await getGuildDocument(message.guild.id);

        Util; gdb;

        let evaled = await eval(script);
        if (typeof evaled !== "string") evaled = inspect(evaled);

        if (evaled.length >= 2000) return message.reply("✅");

        return message.reply({
            content: `\`\`\`js\n${evaled}\n\`\`\``,
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents(
                    new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                )
            ]
        });
    } catch (e) {
        let err: any;
        if (typeof e === "string") err = e.replace(/`/g, "`" + String.fromCharCode(8203));
        else err = e;

        return message.reply({
            content: `\`\`\`fix\n${err}\n\`\`\``,
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents(
                    new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                )
            ]
        });
    };
};