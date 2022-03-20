"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
exports.name = "guildDelete";
async function run(client, guild) {
    const owner = await client.users.fetch(guild.ownerId);
    client.users.fetch("419892040726347776").then((u) => u.send({
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
