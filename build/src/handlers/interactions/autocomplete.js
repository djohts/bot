"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const Util_1 = __importDefault(require("../../util/Util"));
module.exports = async (interaction) => {
    const gdb = await Util_1.default.database.guild(interaction.guildId);
    if (interaction.commandName === "serverstats" &&
        interaction.options.getSubcommand() === "delete") {
        const { statschannels } = gdb.get();
        const respond = [];
        for (const [channelId, text] of Object.entries(statschannels)) {
            respond.push({
                name: text,
                value: channelId
            });
        }
        ;
        await interaction.respond(respond);
    }
    ;
};
