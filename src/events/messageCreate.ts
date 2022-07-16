import { Message } from "discord.js";
// @ts-ignore
import { checkMessage } from "stop-discord-phishing";
import countingHandler from "../handlers/counting/handler";
import { dokdo, linkRates } from "../bot";
import { deleteMessage } from "../handlers/utils";
import Util from "../util/Util";
import { getPermissionLevel } from "../constants/index";

export async function run(message: Message) {
    if (
        !message.guild ||
        message.author.bot ||
        message.channel.type === "DM" ||
        message.channel.name === "dob-flow-editor"
    ) return;

    const gdb = await Util.database.guild(message.guild.id);
    const gsdb = await Util.database.settings(message.guild.id);

    if (gsdb.get().detectScamLinks && await checkMessage(message.content, true)) {
        let guildRates = linkRates.get(message.guild.id);
        if (!guildRates.has(message.author.id)) {
            await message.channel.send(
                `${message.author}, в вашем сообщении была замечена вредоносная ссылка. Сообщение ` +
                (message.deletable ? "будет удалено." : "не будет удалено, так как у меня нет прав на удаление сообщений в этом канале.")
            ).then((m) => setTimeout(() => deleteMessage(m), 10 * 1000));

            guildRates.add(message.author.id);
            setTimeout(() => guildRates.delete(message.author.id), 5000);
        };
        linkRates.set(message.guild.id, guildRates);

        return deleteMessage(message);
    };

    const { channel } = gdb.get();

    if (channel === message.channel.id) return await countingHandler(message);
    if (getPermissionLevel(message.member) >= 5) return dokdo.run(message);
    if (message.content.match(`^<@!?${Util.client.user.id}>`)) return await message.react("👋").catch(() => null);
};