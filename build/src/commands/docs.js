"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("docs")
    .setDescription("Документация по использованию бота.")
    .toJSON();
exports.permission = 0;
const run = async (interaction) => { };
exports.run = run;
