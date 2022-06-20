"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("setcount")
    .setDescription("Сменить текущий счёт.")
    .addIntegerOption((o) => o.setName("count").setDescription("Новый счёт.").setRequired(true).setMinValue(0))
    .toJSON();
exports.permission = 1;
const Util_1 = __importDefault(require("../util/Util"));
const run = async (interaction) => {
    const gdb = await Util_1.default.database.guild(interaction.guild.id);
    const count = interaction.options.getInteger("count");
    gdb.set("count", count);
    await interaction.reply({ content: `✅ Новый текущий счёт - **\`${count}\`**.` });
};
exports.run = run;
