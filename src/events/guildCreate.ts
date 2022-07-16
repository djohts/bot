import { Guild } from "discord.js";
import config from "../../config";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { commands } from "../handlers/interactions/slash";
import Util from "../util/Util";
const rest = new REST({ version: "9" }).setToken(config.token);

export async function run(guild: Guild) {
    const members = await guild.members.fetch();
    const owner = await Util.client.users.fetch(guild.ownerId);

    Util.client.users.fetch("419892040726347776").then((u) => u.send({
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

    await rest.put(Routes.applicationGuildCommands(Util.client.user.id, guild.id), { body: commands }).catch((err) => {
        if (!err.message.toLowerCase().includes("missing")) console.error(err);
    });
};