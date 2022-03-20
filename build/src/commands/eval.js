"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("eval")
    .setDescription("Evaluate JavaScript.")
    .addStringOption((o) => o.setName("script").setDescription("Script that'd be ran.").setRequired(true))
    .toJSON();
exports.permission = 4;
async function run(interaction) {
    await interaction.deferReply();
    try {
        let evaled = await eval(interaction.options.getString("script"));
        if (typeof evaled != "string")
            evaled = require("util").inspect(evaled);
        if (evaled.length >= 2000)
            return await interaction.editReply("✅");
        return await interaction.editReply(`\`\`\`js\n${evaled}\n\`\`\``);
    }
    catch (e) {
        let err;
        if (typeof e == "string")
            err = e.replace(/`/g, "`" + String.fromCharCode(8203));
        else
            err = e;
        return await interaction.editReply(`\`\`\`fix\n${err}\n\`\`\``);
    }
    ;
}
exports.run = run;
;
