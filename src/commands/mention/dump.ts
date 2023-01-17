import { Message } from "discord.js";
import { getGuildDocument } from "../../database";

export const run = async (message: Message<true>, args: string[]) => {
    const guildId = args[0] ?? message.guildId;

    const document = await getGuildDocument(guildId, false);
    const data = JSON.stringify(document.toJSON(), null, 4);
    const now = Date.now();

    return message.author.send({
        content: `💾 Guild data for server ${guildId} as of <t:${Math.floor(now / 1000)}:R>.`,
        files: [{ attachment: Buffer.from(data), name: `dob-dump-${guildId}-${now}.json` }],
    })
        .then((m) => message.reply(`📨 Guild data of ${guildId === message.guildId ? "this server" : `server with ID \`${guildId}\``} has been dumped to your DMs.\n> ${m.url}`))
        .catch(() => message.reply("❌ Something went wrong while trying to send you the data in DMs."));
};