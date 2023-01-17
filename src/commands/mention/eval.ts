import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message, MessageReplyOptions } from "discord.js";
import { generateId } from "../../constants";
import { inspect } from "util";
import config from "../../constants/config";
import axios from "axios";

export const replies = new Map<string, Message<true>>();

export const run = async (message: Message<true>, args: string[]) => {
    const savedReply = replies.get(message.id);
    const reply = savedReply?.edit.bind(savedReply) ?? message.reply.bind(message);

    try {
        const evaluated = eval(args.join(" "));
        if (evaluated instanceof Promise) {
            const botMsg = reply("💨 Running...");
            const start = Date.now();
            return evaluated
                .then(async (result: unknown) => (await botMsg).edit(await generateMessage(message, result, Date.now() - start)))
                .then((m) => replies.set(message.id, m));
        };
        return generateMessage(message, evaluated, null)
            .then((messageOptions) => reply({ ...messageOptions, allowedMentions: { repliedUser: false } }))
            .then((m) => replies.set(message.id, m));
    } catch (err) {
        return generateMessage(message, err, null, false).then(reply).then((m) => replies.set(message.id, m));
    };
};

async function generateMessage(message: Message, result: unknown, time: number | null, success = true, hastebin = false): Promise<MessageReplyOptions> {
    if (hastebin) {
        const res = await axios.post<{ key: string; }>(
            `${config.hastebinLink}/documents`,
            inspect(result, { depth: Infinity, maxArrayLength: Infinity, maxStringLength: Infinity })
        )
            .catch(() => null);

        if (res?.status === 200) {
            const { key } = res.data;
            const url = new URL(`${config.hastebinLink}/${key}.js`);
            return {
                content: `${success ? "✅ Evaluated successfully" : "❌ Javascript failed"}${time ? ` in ${time}ms` : ""}: ${url.toString()}`,
                components: [],
            };
        };

        return {
            content: `${success ? "✅ Evaluated successfully" : "❌ Javascript failed"}${time ? ` in ${time}ms` : ""}: (failed to upload to Hastebin)`,
            components: [],
        };
    };

    const content = generateContent(result, time, success);
    if (!content) return generateMessage(message, result, time, success, true);

    const identifier = generateId(6);

    const collector = message.channel.createMessageComponentCollector({
        filter: (interaction) => interaction.customId === `${identifier}-hastebin` && config.admins.includes(interaction.user.id),
        componentType: ComponentType.Button,
        max: 1
    });
    collector.on("collect", (interaction) => {
        return void generateMessage(message, result, time, success, true).then((messageOptions) => interaction.update(messageOptions));
    });

    return {
        content,
        components: [
            new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder().setCustomId(`${identifier}-hastebin`).setStyle(ButtonStyle.Primary).setLabel("Dump to Hastebin")
            )
        ]
    };
};

function generateContent(result: unknown, time: number | null, success = true, depth = 10, maxArrayLength = 100): string | null {
    if (depth <= 0) return null;
    let content: string | null = `${success ? "✅ Evaluated successfully" : "❌ Javascript failed"}${time ? ` in ${time}ms` : ""}:\`\`\`ansi\n${inspect(result, { colors: true, depth, maxArrayLength })}\`\`\``;

    if (content.length > 2000) {
        if (depth === 1 && Array.isArray(result) && maxArrayLength > 1) content = generateContent(result, time, success, depth, maxArrayLength - 1);
        else content = generateContent(result, time, success, depth - 1, maxArrayLength);
    };
    return content;
};