import { ChannelType, Message, ThreadChannel, Webhook } from "discord.js";
import { getPermissionLevel } from "../../constants";
import { queueDelete } from "./../utils";
import Util from "../../util/Util";

export = async (message: Message) => {
    const gdb = await Util.database.guild(message.guild.id);
    const permissionLevel = getPermissionLevel(message.member), content = message.content;
    if (content.startsWith("!") && permissionLevel >= 1) return;
    let { count, user, modules } = gdb.get();
    if (message.client.loading) return queueDelete([message]);

    if (
        (!modules.includes("allow-spam") && message.author.id === user) ||
        (!modules.includes("talking") && content !== `${count + 1}`) ||
        content.split(/\s/g)[0] !== `${count + 1}`
    ) {
        return queueDelete([message]);
    };

    count++;
    gdb.addToCount(message.member);

    let countingMessage = message;
    if (
        message.channel.type === ChannelType.DM ||
        message.channel instanceof ThreadChannel
    ) return;
    if (modules.includes("webhook")) try {
        const webhooks = await message.channel.fetchWebhooks();
        let webhook: Webhook | null = webhooks.find((w: Webhook) => w.name === "Counting");
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
            });
            queueDelete([message]);
        };
    } catch (e) { }
    else if (modules.includes("embed")) try {
        const webhooks = await message.channel.fetchWebhooks();
        let webhook: Webhook | null = webhooks.find((w: Webhook) => w.name === "Counting");
        if (!webhook) webhook = await message.channel.createWebhook({ name: "Counting" });

        if (webhook) {
            countingMessage = await webhook.send({
                embeds: [{
                    description: `${content}`,
                    color: message.member.displayColor
                }],
                username: message.author.username,
                avatarURL: message.author.displayAvatarURL()
            });
            queueDelete([message]);
        };
    } catch (e) { };

    gdb.set("message", countingMessage.id);
};