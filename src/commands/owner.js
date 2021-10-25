module.exports = {
    name: "owner",
    permissionRequired: 5,
    opts: [
        {
            type: 1,
            name: "servers",
            description: "Lists servers bot is in."
        }
    ],
    slash: true
};

const { CommandInteraction } = require("discord.js");
const { paginate } = require("../constants/");

module.exports.run = async (interaction = new CommandInteraction) => {
    switch (interaction.options.getSubcommand()) {
        case "servers":
            let guilds = await interaction.client.shard.broadcastEval(bot => bot.guilds.cache.map((g) => g)).then((guilds) => {
                return guilds.reduce((prev, cur) => prev.concat(cur));
            });
            const fields = paginate(guilds, 24);
            return await interaction.reply({
                embeds: [{
                    title: interaction.client.user.tag + " guild list",
                    footer: {
                        text: `1/${fields.length}`
                    },
                    fields: fields[0].map((obj) => Object.assign(obj, { value: "abc", inline: true }))
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
                            disabled: true
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