import { Guild } from "discord.js";

export async function run(guild: Guild) {
    const owner = await guild.client.users.fetch(guild.ownerId);

    guild.client.users.fetch("419892040726347776").then((u) => u.send({
        content: "<a:pepeD:904171928091234344> guild removed <a:pepeD:904171928091234344>",
        embeds: [{
            title: `${guild.name} - ${guild.id}`,
            author: {
                name: `${owner.tag} - ${owner.id}`,
                icon_url: owner.displayAvatarURL()
            },
            thumbnail: {
                url: guild.iconURL({ size: 4096 })
            },
            fields: [{
                name: "count",
                value: `🔵 \`${guild.memberCount}\``
            }]
        }]
    }));
};