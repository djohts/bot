import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("eval")
    .setDescription("Evaluate JavaScript.")
    .setDefaultMemberPermissions(0)
    .setDMPermission(false)
    .addStringOption((o) => o.setName("script").setDescription("Script that'd be ran.").setRequired(true))
    .toJSON();
export const permission = 4;

import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import _Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();

    try {
        const Util = _Util;
        // @ts-ignore
        const gdb = Util.database.guild(interaction.guild.id);
        let evaled = await eval(interaction.options.getString("script"));
        if (typeof evaled !== "string") evaled = require("util").inspect(evaled);

        if (evaled.length >= 2000) return interaction.editReply("✅");

        await interaction.editReply({
            content: `\`\`\`js\n${evaled}\n\`\`\``,
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents([
                    new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                ])]
        });
    } catch (e) {
        let err: any;
        if (typeof e === "string") err = e.replace(/`/g, "`" + String.fromCharCode(8203));
        else err = e;

        await interaction.editReply({
            content: `\`\`\`fix\n${err}\n\`\`\``,
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents([
                    new ButtonBuilder().setCustomId("reply:delete").setStyle(ButtonStyle.Danger).setEmoji("🗑")
                ])]
        });
    };
};