const { Client, Guild } = require("discord.js");
const { linkRates } = require("../bot");
const { token } = require("../../config");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const rest = new REST({ version: "9" }).setToken(token);

module.exports = {
    name: "guildCreate",

    run: async (client, guild) => {
        if (!(client instanceof Client)) return;
        if (!(guild instanceof Guild)) return;

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
                thumbnail: guild.iconURL({ dynamic: true, format: "png", size: 512 }),
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
    }
};