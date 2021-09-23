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
    let presence = member.presence;

    const emb = new MessageEmbed()
        .setAuthor(
            user.tag,
            user.avatarURL({ dynamic: true }) || user.defaultAvatarURL,
            user.avatarURL({ dynamic: true }) || user.defaultAvatarURL
        )
        .setTimestamp(Date.now());
    emb
        .setDescription(`**Аккаунт создан**: <t:${Math.round(user.createdTimestamp / 1000)}>`)
        .setDescription(emb.description + `\n**Присоединился**: <t:${Math.round(member.joinedTimestamp / 1000)}>`);

    if (presence?.activities?.slice(1).length)
        emb.setDescription(
            emb.description +
            `\n**Активност${presence.activities.length == 1 ? "ь" : "и"}**: ${member.presence.activities.slice(1).map((activity) => `\`${activity.name}\``).join(", ")}`
        );

    if (presence?.activities.find((activity) => activity.name == "Custom Status")) {
        const status = presence.activities[0];
        emb.setDescription(emb.description + `\n**Пользовательский статус**: ${status.emoji} ${status.state || status.name}`);
    };

    return await interaction.reply({ embeds: [emb] });
};