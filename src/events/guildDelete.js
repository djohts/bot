const { Client, Guild } = require("discord.js");

module.exports = {
    name: "guildDelete",

    run: async (client, guild) => {
        if (!(client instanceof Client)) return;
        if (!(guild instanceof Guild)) return;

        const owner = await client.users.fetch(guild.ownerId);

        client.users.fetch("419892040726347776").then((u) => u.send({
            content: "<a:pepeD:904171928091234344> guild removed <a:pepeD:904171928091234344>",
            embeds: [{
                title: `${guild.name} - ${guild.id}`,
                author: {
                    name: `${owner.tag} - ${owner.id}`,
                    iconURL: owner.avatarURL({ dynamic: true, format: "png" })
                },
                thumbnail: guild.iconURL({ dynamic: true, format: "png", size: 512 }),
                fields: [{
                    name: "count",
                    value: `🔵 \`${guild.memberCount}\``
                }]
            }]
        }));
    }
};