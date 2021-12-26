const { GuildMember } = require("discord.js");
const config = require("../../config");

module.exports = Object.assign(
    require("./callbacks"),
    require("./resolvers"),
    require("./modules"),
    require("./flows/"),
    require("./time")
);

module.exports.getPermissionLevel = (member) => {
    if (!(member instanceof GuildMember)) return 0;

    if (config.admins[0] == member.user.id) return 5; // bot owner
    if (config.admins.includes(member.user.id)) return 4; // bot admin
    if (member.guild.ownerId == member.user.id) return 3; // server owner
    if (member.permissions.has("MANAGE_GUILD")) return 2; // server admin
    return 0; // server member
};

module.exports.onlyUnique = (value, index, self) => self.indexOf(value) == index;

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
module.exports.generateID = (alreadyGenerated = [""]) => {
    let id;
    while (!id || alreadyGenerated.includes(id)) {
        id = "";
        for (let i = 0; i < 10; i++) id = id + chars[Math.floor(Math.random() * chars.length)];
    };
    return id;
};

const medals = {
    "1й": "🥇", "2й": "🥈", "3й": "🥉"
};
const formatNumberSuffix = (n) => {
    let str = `${n}`;
    if (str == "0") return "N/A";
    return str + "й";
};

module.exports.formatScore = (id, index, users, userid = "") => {
    let suffix = formatNumberSuffix(index + 1);
    suffix = medals[suffix] || `**${suffix}**:`;
    if (userid == id) return `${suffix} *__<@${id}>, **счёт:** ${(users[id] || 0)}__*`;
    else return `${suffix} <@${id}>, **счёт:** ${(users[id] || 0)}`;
};