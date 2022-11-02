import { ChannelType, Message } from "discord.js";
import { getGuildDocument } from "../database";
import countingHandler from "../handlers/counting/handler";
import config from "../constants/config";
import Util from "../util/Util";

export async function run(message: Message) {
    if (
        message.author.bot ||
        message.channel.type === ChannelType.DM
    ) return;

    const document = await getGuildDocument(message.guild.id);
    const _ = Util.i18n.getLocale(document.locale);

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
        void message.reply([
            _("events.messageCreate.welcome_l1"),
            _("events.messageCreate.welcome_l2", { docs: await Util.func.getCommandMention("docs") }),
            _("events.messageCreate.welcome_l3", { info: await Util.func.getCommandMention("info") })
        ].join("\n")).catch(() => null);
    };
};