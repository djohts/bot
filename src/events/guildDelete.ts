import { Guild } from "discord.js";
import Util from "../util/Util";

export async function run(guild: Guild) {
    const owner = await Util.client.users.fetch(guild.ownerId);

    Util.client.users.fetch("419892040726347776").then((u) => u.send({
        content: "<a:pepeD:904171928091234344> guild removed <a:pepeD:904171928091234344>",
        embeds: [{
            title: `${guild.name} - ${guild.id}`,
            author: {
                name: `${owner.tag} - ${owner.id}`,
                icon_url: owner.avatarURL(),
                url: `https://discord.com/users/${owner.id}`
            },
            thumbnail: {
                url: guild.iconURL({ size: 512 })
            },
            fields: [{
                name: "count",
                value: `🔵 \`${guild.memberCount}\``
            }]
        }]
    }));
};