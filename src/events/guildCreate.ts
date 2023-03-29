import { Guild } from "discord.js";

export async function run(guild: Guild) {
    if (!guild.available) return;

    const owner = await guild.client.users.fetch(guild.ownerId);

    guild.client.users.send("419892040726347776", {
        content: "<a:pepeD:904171928091234344> new guild <a:pepeD:904171928091234344>",
        embeds: [{
            title: `${guild.name} - ${guild.id}`,
            author: {
                name: `${owner.tag} - ${owner.id}`,
                icon_url: owner.displayAvatarURL()
            },
            thumbnail: {
                url: guild.iconURL() ?? ""
            },
            fields: [{
                name: "count",
                value: `🔵 \`${guild.memberCount}\``
            }]
        }]
    });
};