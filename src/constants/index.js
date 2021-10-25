const { GuildMember } = require("discord.js");
const config = require(__dirname + "/../../config");

module.exports = Object.assign(
    require(__dirname + "/time"), require(__dirname + "/resolvers")
);

module.exports.paginate = (arr = [], size = 4) => {
    return arr.reduce((acc, val, i) => {
        let idx = Math.floor(i / size);
        let page = acc[idx] || (acc[idx] = []);
        page.push(val);

        return acc;
    }, []);
};

module.exports.getPermissionLevel = (member = new GuildMember) => {
    let idk = member instanceof GuildMember;
    if (!idk) return 0;

    if (config.admins[0] == member.user.id) return 5; // bot owner
    if (config.admins.includes(member.user.id)) return 4; // bot admin
    if (member.guild.ownerId == member.user.id) return 3; // server owner
    if (member.permissions.has("MANAGE_GUILD")) return 2; // server admin
    return 0; // server member
};

module.exports.plurify = (number = 0, word = "") => {
    const endsWith = (str, suffix) => {
        return String(str).match(suffix + "$") == suffix;
    };

    if (
        endsWith(number, 0) ||
        endsWith(number, 5) ||
        endsWith(number, 6) ||
        endsWith(number, 7) ||
        endsWith(number, 8) ||
        endsWith(number, 9)
    ) return `${number} ${word}ов`;
    else if (endsWith(number, 1)) return `${number} ${word}`;
    else if (
        endsWith(number, 2) ||
        endsWith(number, 3) ||
        endsWith(number, 4)
    ) return `${number} ${word}а`;
};