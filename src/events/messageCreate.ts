import { ChannelType, Message } from "discord.js";
import { getGuildDocument } from "../database";
import countingHandler from "../handlers/counting/handler";
import config from "../constants/config";
import Util from "../util/Util";
import i18next from "i18next";

export async function run(message: Message) {
    if (
        message.author.bot ||
        message.channel.type === ChannelType.DM
    ) return;

    const document = await getGuildDocument(message.guild.id);
    const t = i18next.getFixedT(document.locale, null, "events.messageCreate");

    if (
        message.content.startsWith(`<@${Util.client.user.id}> eval`)
        && config.admins.includes(message.author.id)
    ) return require("../commands/eval").run(message);
    if (
        message.content.startsWith(`<@${Util.client.user.id}> exec`)
        && config.admins.includes(message.author.id)
    ) return require("../commands/exec").run(message);

    if (document.counting.channelId === message.channel.id) return countingHandler(message);
    if (message.content.match(`^<@!?${Util.client.user.id}>`)) {
        void message.react("👋").catch(() => null);
        void message.reply(
            t("events.messageCreate.welcome", {
                docs: await Util.func.getCommandMention("docs"),
                info: await Util.func.getCommandMention("info")
            })
        ).catch(() => null);
    };
};