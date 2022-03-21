"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.permission = exports.options = void 0;
const builders_1 = require("@discordjs/builders");
exports.options = new builders_1.SlashCommandBuilder()
    .setName("ping")
    .setDescription("Посмотреть задержку бота.")
    .toJSON();
exports.permission = 0;
const database_1 = __importDefault(require("../database/"));
const pretty_ms_1 = __importDefault(require("pretty-ms"));
const mongoose_1 = require("mongoose");
async function run(interaction) {
    const gdb = await database_1.default.guild(interaction.guild.id);
    const { channel } = gdb.get();
    const server = Date.now() - interaction.createdTimestamp;
    const uptime = (0, pretty_ms_1.default)(interaction.client.uptime);
    const api = Math.ceil(interaction.guild.shard.ping);
    let dbping = Date.now();
    await (0, mongoose_1.model)("Guild").find();
    dbping = Date.now() - dbping;
    await interaction.reply({
        embeds: [{
                title: "🏓 Понг!",
                description: [
                    "```",
                    `Сервер   :: ${server}ms`,
                    `API      :: ${api}ms`,
                    `DB       :: ${dbping}ms`,
                    `Аптайм   :: ${uptime}`,
                    "```"
                ].join("\n")
            }],
        ephemeral: interaction.channel.id == channel
    });
}
exports.run = run;
;
