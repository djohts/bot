"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const discord_js_1 = require("discord.js");
exports.options = new discord_js_1.SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Список лидеров счёта.")
    .toJSON();
exports.permission = 0;
const constants_1 = require("../constants/");
const Util_1 = __importDefault(require("../util/Util"));
const run = async (interaction) => {
    const gdb = await Util_1.default.database.guild(interaction.guild.id);
    const { users } = gdb.get();
    const sorted = Object.keys(users).sort((a, b) => users[b] - users[a]);
    const top = sorted.slice(0, 25);
    const leaderboard = top.map((id, index) => (0, constants_1.formatScore)(id, index, users, interaction.user.id));
    let description = leaderboard.join("\n");
    if (!top.includes(interaction.user.id)) {
        if (leaderboard.length)
            description = description + "\n^^^^^^^^^^^^^^^^^^^^^^^^^\n";
        description = description + (0, constants_1.formatScore)(interaction.user.id, sorted.indexOf(interaction.user.id), users);
    }
    ;
    await interaction.reply({
        embeds: [{
                title: `Таблица лидеров ${interaction.guild.name}`,
                description
            }]
    });
};
exports.run = run;
