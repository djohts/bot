import crypto from "crypto";

export const generateId = (length: number): string => {
    if (length < 1) return "";

    return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
};

const medals = [
    "🥇", "🥈", "🥉"
];
const formatNumberSuffix = (n: number): string => {
    if (n === 0) return "N/A";
    return `${n}th`;
};

export const formatScore = (id: string, index: number, users: Map<string, number>, userid?: string): string => {
    const suffix = medals[index] ?? `**${formatNumberSuffix(index + 1)}**:`;

    if (userid === id) return `${suffix} *__<@${id}>, **score:** ${users.get(id) ?? 0}__*`;
    return `${suffix} <@${id}>, **score:** ${users.get(id) ?? 0}`;
};