"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const Util_1 = __importDefault(require("../util/Util"));
exports.name = "guildDelete";
async function run(guild) {
    const owner = await Util_1.default.client.users.fetch(guild.ownerId);
    Util_1.default.client.users.fetch("419892040726347776").then((u) => u.send({
        content: "<a:pepeD:904171928091234344> guild removed <a:pepeD:904171928091234344>",
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
                        name: "count",
                        value: `🔵 \`${guild.memberCount}\``
                    }]
            }]
    }));
}
exports.run = run;
;
