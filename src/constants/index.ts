import { GuildMember, PermissionFlagsBits } from "discord.js";
import crypto from "crypto";
import config from "../../config";

export const getPermissionLevel = (member: GuildMember): 5 | 4 | 3 | 2 | 1 | 0 => {
    if (config.admins[0] === member.user.id) return 5; // bot owner
    if (config.admins.includes(member.user.id)) return 4; // bot admin
    if (member.guild.ownerId === member.user.id) return 3; // server owner
    if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return 2; // server admin
    return 0; // server member
};

export const generateID = (length = 10): string => {
    if (length < 1) length = 10;

    return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
};

const medals = {
    "1й": "🥇", "2й": "🥈", "3й": "🥉"
};
const formatNumberSuffix = (n: number): string => {
    let str = `${n}`;
    if (str == "0") return "N/A";
    return str + "й";
};

export const formatScore = (id: string, index: number, users: object, userid?: string): string => {
    let suffix = formatNumberSuffix(index + 1);
    suffix = medals[suffix] || `**${suffix}**:`;
    if (userid === id) return `${suffix} *__<@${id}>, **счёт:** ${(users[id] || 0)}__*`;
    else return `${suffix} <@${id}>, **счёт:** ${(users[id] || 0)}`;
};