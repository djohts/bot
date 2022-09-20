import { GuildMember } from "discord.js";
import config from "../../config";
import crypto from "crypto";

export const getPermissionLevel = (member: GuildMember): 5 | 4 | 0 => {
    if (config.admins[0] === member.user.id) return 5; // bot owner
    if (config.admins.includes(member.user.id)) return 4; // bot admin
    return 0;
};

export const generateID = (length = 10): string => {
    if (length < 1) length = 10;

    return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
};

const medals = [
    "🥇", "🥈", "🥉"
];
const formatNumberSuffix = (n: number): string => {
    if (n === 0) return "N/A";
    return `${n}й`;
};

export const formatScore = (id: string, index: number, users: object, userid?: string): string => {
    const suffix = medals[index] ?? `**${formatNumberSuffix(index + 1)}**:`;

    if (userid === id) return `${suffix} *__<@${id}>, **score:** ${users[id] ?? 0}__*`;
    return `${suffix} <@${id}>, **score:** ${users[id] ?? 0}`;
};