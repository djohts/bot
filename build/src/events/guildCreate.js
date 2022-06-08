"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const bot_1 = require("../bot");
const config_1 = __importDefault(require("../../config"));
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const slash_1 = require("../handlers/interactions/slash");
const Util_1 = __importDefault(require("../util/Util"));
const rest = new rest_1.REST({ version: "9" }).setToken(config_1.default.token);
async function run(guild) {
    bot_1.linkRates.set(guild.id, new Set());
    const members = await guild.members.fetch();
    const owner = await Util_1.default.client.users.fetch(guild.ownerId);
    Util_1.default.client.users.fetch("419892040726347776").then((u) => u.send({
        content: "<a:pepeD:904171928091234344> new guild <a:pepeD:904171928091234344>",
        embeds: [{
                title: `${guild.name} - ${guild.id}`,
                author: {
                    name: `${owner.tag} - ${owner.id}`,
                    iconURL: owner.avatarURL({ dynamic: true, format: "png" })
                },
                thumbnail: {
                    url: guild.iconURL({ dynamic: true, format: "png", size: 512 })
                },
                fields: [{
                        name: "counts",
                        value: [
                            `🤖 \`${members.filter((a) => a.user.bot).size}\``,
                            `🧑‍🤝‍🧑 \`${members.filter((a) => !a.user.bot).size}\``,
                            `🔵 \`${guild.memberCount}\``
                        ].join("\n")
                    }]
            }]
    }));
    await rest.put(v9_1.Routes.applicationGuildCommands(Util_1.default.client.user.id, guild.id), { body: slash_1.commands }).catch((err) => {
        if (!err.message.toLowerCase().includes("missing"))
            console.error(err);
    });
}
exports.run = run;
;
