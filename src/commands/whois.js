module.exports = {
    name: "whois",
    description: "Посмотреть информацию о пользователе.",
    opts: [{
        name: "member",
        description: "Участник, о котором Вы хотите получить информацию.",
        type: 6
    }],
    permissionRequired: 0,
    slash: true
};

const { CommandInteraction, MessageEmbed, GuildMember } = require("discord.js");

module.exports.run = async (interaction = new CommandInteraction) => {
    const guild = interaction.guild;
    const user = interaction.options.getUser("member") ?
        await interaction.client.users.fetch(interaction.options.getUser("member").id) : await interaction.client.users.fetch(interaction.user.id);
    const member = interaction.options.getMember("member") ?
        await guild.members.fetch(interaction.options.getUser("member").id) : await guild.members.fetch(interaction.user.id);
    let presence = member.presence;

    const emb = new MessageEmbed()
        .setAuthor(
            user.tag,
            user.avatarURL({ dynamic: true }) || user.defaultAvatarURL,
            user.avatarURL({ dynamic: true }) || user.defaultAvatarURL
        )
        .setDescription(`**Аккаунт создан**: <t:${Math.round(user.createdTimestamp / 1000)}>`)
        .setTimestamp(Date.now());
    emb
        .setDescription(emb.description + `\n**Присоединился**: <t:${Math.round(member.joinedTimestamp / 1000)}>`);

    if (getStatus(member)) emb.setDescription(emb.description + `\n**Статус**: ${getStatus(member)}`);

    if (presence?.activities?.slice(1).length)
        emb.setDescription(
            emb.description +
            `\n**Активност${presence.activities.length == 1 ? "ь" : "и"}**: ${member.presence.activities.slice(1).map((activity) => `\`${activity.name}\``).join(", ")}`
        );

    if (presence?.activities.find((activity) => activity.id == "custom")) {
        const status = presence.activities[0];
        emb.setDescription(
            emb.description +
            `\n**Пользовательский статус**:${status.emoji ? ` ${status.emoji}` : ""} ${status.state || status.name}`
        );
    };

    return await interaction.reply({
        embeds: [emb],
        ephemeral: (gdb.get().channel == interaction.channel.id)
    });
};

function getStatus(member = new GuildMember) {
    if (!member.presence) return "<:offline:887393623660986391> Оффлайн/Невидимка";
    if (member.presence.status == "invisible") return "<:offline:887393623660986391> Невидимка";
    if (member.presence.status == "offline") return "<:offline:887393623660986391> Оффлайн";
    if (member.presence.status == "dnd") return "<:dnd:887393623786803270> Не беспокоить";
    if (member.presence.status == "online") return "<:online:887393623845507082> Онлайн";
    if (member.presence.status == "idle") return "<:idle:887393623820353647> Отошёл";
    return "⚠️ Не удалось получить статус пользователя.";
};