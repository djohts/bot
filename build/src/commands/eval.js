"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const discord_js_1 = require("discord.js");
exports.options = new discord_js_1.SlashCommandBuilder()
    .setName("eval")
    .setDescription("Evaluate JavaScript.")
    .addStringOption((o) => o.setName("script").setDescription("Script that'd be ran.").setRequired(true))
    .toJSON();
exports.permission = 4;
const discord_js_2 = require("discord.js");
const Util_1 = __importDefault(require("../util/Util"));
const run = async (interaction) => {
    await interaction.deferReply();
    try {
        const Util = Util_1.default;
        const gdb = Util.database.guild(interaction.guild.id);
        let evaled = await eval(interaction.options.getString("script"));
        if (typeof evaled !== "string")
            evaled = require("util").inspect(evaled);
        if (evaled.length >= 2000)
            return await interaction.editReply("✅");
        await interaction.editReply({
            content: `\`\`\`js\n${evaled}\n\`\`\``,
            components: [
                new discord_js_2.ActionRowBuilder().setComponents([
                    new discord_js_2.ButtonBuilder().setCustomId("reply:delete").setStyle(discord_js_2.ButtonStyle.Danger).setEmoji("🗑")
                ])
            ]
        });
    }
    catch (e) {
        let err;
        if (typeof e === "string")
            err = e.replace(/`/g, "`" + String.fromCharCode(8203));
        else
            err = e;
        await interaction.editReply({
            content: `\`\`\`fix\n${err}\n\`\`\``,
            components: [
                new discord_js_2.ActionRowBuilder().setComponents([
                    new discord_js_2.ButtonBuilder().setCustomId("reply:delete").setStyle(discord_js_2.ButtonStyle.Danger).setEmoji("🗑")
                ])
            ]
        });
    }
    ;
};
exports.run = run;
