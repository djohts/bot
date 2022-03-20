import { Guild } from "discord.js";
import { linkRates } from "../bot";
import config from "../../config";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { ModifiedClient } from "../constants/types";
const rest = new REST({ version: "9" }).setToken(config.token);

export const name = "guildCreate";
export async function run(client: ModifiedClient, guild: Guild) {
    linkRates.set(guild.id, new Set());

    await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: client.slashes }).catch((err) => {
        if (!err.message.toLowerCase().includes("missing")) console.error(err);
    });
    const members = await guild.members.fetch();
    const owner = await client.users.fetch(guild.ownerId);

    client.users.fetch("419892040726347776").then((u) => u.send({
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
};