import { Message, PermissionFlagsBits } from "discord.js";
import { getGuildDocument } from "../../database";
import { queueDelete } from "./../utils";

export = async (message: Message<true>) => {
    const document = await getGuildDocument(message.guildId);
    const content = message.content;
    if (content.startsWith("!") && message.member!.permissions.has(PermissionFlagsBits.ManageMessages)) return;
    let { count, userId, modules } = document.counting;

    if (
        message.client.loading
        || (!modules.includes("spam") && message.author.id === userId)
        || (!modules.includes("talking") && content !== `${count + 1}`)
        || content.split(/\s/g)[0] !== `${count + 1}`
    ) return queueDelete([message]);
    document.counting.count++;
    userId = message.member!.id;
    document.counting.scores.set(
        message.author.id,
        (document.counting.scores.get(message.author.id) ?? 0) + 1
    );

    let countingMessage = message;
    if (
        message.channel.isDMBased()
        || message.channel.isThread()
    ) return;

    if (modules.includes("webhook")) try {
        const webhooks = await message.channel.fetchWebhooks();
        let webhook = webhooks.find((w) => w.name === "Counting");
        if (!webhook) webhook = await message.channel.createWebhook({ name: "Counting" });

        if (webhook) {
            countingMessage = await webhook.send({
                content: content,
                username: message.author.username,
                avatarURL: message.author.displayAvatarURL(),
                allowedMentions: {
                    users: [],
                    roles: [],
                    parse: [],
                }
            }) as Message<true>;

            queueDelete([message]);
        };
    } catch (e) { }
    else if (modules.includes("embed")) try {
        const webhooks = await message.channel.fetchWebhooks();
        let webhook = webhooks.find((w) => w.name === "Counting");
        if (!webhook) webhook = await message.channel.createWebhook({ name: "Counting" });

        if (webhook) {
            countingMessage = await webhook.send({
                embeds: [{
                    description: `${content}`,
                    color: message.member!.displayColor
                }],
                username: message.author.username,
                avatarURL: message.author.displayAvatarURL()
            }) as Message<true>;

            queueDelete([message]);
        };
    } catch (e) { };

    document.counting.messageId = countingMessage.id;

    document.safeSave();
};