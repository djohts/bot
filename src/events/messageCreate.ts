import { getGuildDocument } from "../database";
import { Message } from "discord.js";
import countingHandler from "../handlers/counting/handler";
import mentionCommands from "../handlers/mentionCommands";
import config from "../constants/config";
import Util from "../utils/Util";
import i18next from "i18next";

export async function run(message: Message<true>) {
    if (
        message.client.loading
        || message.author.bot
    ) return;

    const document = await getGuildDocument(message.guildId);
    const t = i18next.getFixedT<any, any>(document.locale, null, "events.messageCreate");

    if (
        message.content.startsWith(`<@${message.client.user.id}> `)
        && config.admins.includes(message.author.id)
    ) return mentionCommands(message);

    if (document.counting.channelId === message.channel.id) return countingHandler(message);
    if (message.content.match(`^<@!?${message.client.user.id}>`)) {
        void message.react("👋").catch(() => null);
        void message.reply(
            t("welcome", {
                docs: await Util.func.getCommandMention("docs"),
                info: await Util.func.getCommandMention("info"),
                joinArrays: "\n"
            })
        ).catch(() => null);
    };
};