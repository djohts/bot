import { ChannelType, Message } from "discord.js";
import { getPermissionLevel } from "../constants";
import countingHandler from "../handlers/counting/handler";
import Util from "../util/Util";

export async function run(message: Message) {
    if (
        message.author.bot ||
        message.channel.type === ChannelType.DM ||
        message.channel.name === "dob-flow-editor"
    ) return;

    const gdb = await Util.database.guild(message.guild.id);
    const { channel } = gdb.get();

    if (
        message.content.startsWith(`<@${Util.client.user.id}> eval`)
        && getPermissionLevel(message.member) > 4
    ) return require("../commands/eval").run(message);
    if (
        message.content.startsWith(`<@${Util.client.user.id}> exec`)
        && getPermissionLevel(message.member) > 4
    ) return require("../commands/exec").run(message);

    if (channel === message.channel.id) return countingHandler(message);
    if (message.content.match(`^<@!?${Util.client.user.id}>`)) {
        await message.react("👋").catch(() => null);
        return await message.reply([
            "👋 Привет! Я использую слеш-команды (`/`).",
            "Документацию по моему использованию вы получите по команде `/docs`.",
            "Остались вопросы? Ответы на них вы найдёте на сервере поддержки (`/info`)."
        ].join("\n")).catch(() => null);
    };
};