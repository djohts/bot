const { ButtonInteraction } = require("discord.js");
const { deleteMessage } = require("../../handlers/utils");
const { paginate } = require("../../constants/");

module.exports = async (interaction = new ButtonInteraction) => {
    if (["DEFAULT", "REPLY"].includes(interaction.message.type)) {
        if (
            interaction.user.id != (await interaction.channel.messages.fetch(interaction.message.reference.messageId).then((m) => m.author.id))
        ) return interaction.reply({ content: "❌ Вы не можете использовать это.", ephemeral: true });
    } else if (interaction.message.type == "APPLICATION_COMMAND") {
        if (
            interaction.user.id != interaction.message.interaction.user.id
        ) return interaction.reply({ content: "❌ Вы не можете использовать это.", ephemeral: true });
    };

    if (interaction.customId == "reply:delete") return deleteMessage(interaction.message);

    if (interaction.customId == "servers:prev") {
        let guilds = await interaction.client.shard.broadcastEval(bot => bot.guilds.cache.map((g) => Object.assign({}, {
            name: g.name,
            value: [
                `🤖 \`${g.members.cache.filter((a) => a.user.bot).size}\``,
                `🧑‍🤝‍🧑 \`${g.members.cache.filter((a) => !a.user.bot).size}\``,
                `🔵 \`${g.memberCount}\``
            ].join("\n"),
            inline: true
        }))).then((guilds) => {
            return guilds.reduce((prev, cur) => prev.concat(cur));
        });
        const fields = paginate(guilds, 9);
        const page = Number(interaction.message.embeds[0].footer.text.split("/")[0]) - 1;
        return interaction.update({
            embeds: [{
                title: interaction.client.user.tag + " guild list",
                footer: {
                    text: `${page}/${fields.length}`
                },
                fields: fields[page - 1].map((obj) => obj)
            }],
            components: [{
                type: 1,
                components: [
                    {
                        type: 2,
                        emoji: {
                            name: "⬅️"
                        },
                        style: 4,
                        custom_id: "servers:prev",
                        disabled: (page == 1 ? true : false)
                    },
                    {
                        type: 2,
                        emoji: {
                            name: "➡️"
                        },
                        style: 4,
                        custom_id: "servers:next",
                        disabled: (page == fields.length ? true : false)
                    },
                    {
                        type: 2,
                        emoji: {
                            name: "🗑"
                        },
                        style: 4,
                        custom_id: "reply:delete"
                    }
                ]
            }]
        });
    };
    if (interaction.customId == "servers:next") {
        let guilds = await interaction.client.shard.broadcastEval(bot => bot.guilds.cache.map((g) => Object.assign({}, {
            name: g.name,
            value: [
                `🤖 \`${g.members.cache.filter((a) => a.user.bot).size}\``,
                `🧑‍🤝‍🧑 \`${g.members.cache.filter((a) => !a.user.bot).size}\``,
                `🔵 \`${g.memberCount}\``
            ].join("\n"),
            inline: true
        }))).then((guilds) => {
            return guilds.reduce((prev, cur) => prev.concat(cur));
        });
        const fields = paginate(guilds, 9);
        const page = Number(interaction.message.embeds[0].footer.text.split("/")[0]) + 1;
        return interaction.update({
            embeds: [{
                title: interaction.client.user.tag + " guild list",
                footer: {
                    text: `${page}/${fields.length}`
                },
                fields: fields[page - 1].map((obj) => obj)
            }],
            components: [{
                type: 1,
                components: [
                    {
                        type: 2,
                        emoji: {
                            name: "⬅️"
                        },
                        style: 4,
                        custom_id: "servers:prev",
                        disabled: (page == 1 ? true : false)
                    },
                    {
                        type: 2,
                        emoji: {
                            name: "➡️"
                        },
                        style: 4,
                        custom_id: "servers:next",
                        disabled: (page == fields.length ? true : false)
                    },
                    {
                        type: 2,
                        emoji: {
                            name: "🗑"
                        },
                        style: 4,
                        custom_id: "reply:delete"
                    }
                ]
            }]
        });
    };
};