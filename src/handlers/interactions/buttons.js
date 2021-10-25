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
        interaction.reply("ok");
        let guilds = await interaction.client.shard.broadcastEval(bot => bot.guilds.cache.map((g) => g)).then((guilds) => {
            return guilds.reduce((prev, cur) => prev.concat(cur));
        });
        const fields = paginate(guilds, 9);
        const page = Number(interaction.message.embeds[0].footer.text.split("/")[0]) - 1;
        return interaction.message.edit({
            embeds: [{
                title: interaction.client.user.tag + " guild list",
                footer: {
                    text: `${page}/${fields.length}`
                },
                fields: fields[page - 1].map((obj) => Object.assign(obj, { value: "abc", inline: true }))
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
                        disabled: (fields.length == 1 ? true : false)
                    }
                ]
            }]
        });
    };
    if (interaction.customId == "servers:next") {
        interaction.reply("ok");
        let guilds = await interaction.client.shard.broadcastEval(bot => bot.guilds.cache.map((g) => g)).then((guilds) => {
            return guilds.reduce((prev, cur) => prev.concat(cur));
        });
        const fields = paginate(guilds, 9);
        const page = Number(interaction.message.embeds[0].footer.text.split("/")[0]) + 1;
        return interaction.message.edit({
            embeds: [{
                title: interaction.client.user.tag + " guild list",
                footer: {
                    text: `${page}/${fields.length}`
                },
                fields: fields[page - 1].map((obj) => Object.assign(obj, { value: "abc", inline: true }))
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
                        disabled: (fields.length == 1 ? true : false)
                    }
                ]
            }]
        });
    };
};