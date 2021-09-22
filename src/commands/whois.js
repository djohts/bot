module.exports = {
    description: "Посмотреть информацию о пользователе.",
    opts: [{
        name: "member",
        description: "Участник, о котором Вы хотите получить информацию.",
        type: 6,
        required: false
    }],
    permissionRequired: 0,
    slash: true
};

const { CommandInteraction, MessageEmbed } = require("discord.js");

module.exports.run = async (interaction = new CommandInteraction) => {
    let user = interaction.options.getUser("member") || interaction.user;
    let member = interaction.options.getMember("member") || interaction.member;

    const emb = new MessageEmbed()
        .setAuthor(
            user.tag,
            user.avatarURL({ dynamic: true }) || user.defaultAvatarURL,
            user.avatarURL({ dynamic: true }) || user.defaultAvatarURL
        )
        .setTimestamp(Date.now());
    if (member.presence?.activities) emb.addField("Активности", member.presence.activities.map((activity) => `\`${activity.name}\``).join(", "));

    return await interaction.reply({ embeds: [emb] });
};