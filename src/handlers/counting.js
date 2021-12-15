const { getPermissionLevel, limitFlows, flow: { triggers: allTriggers, actions: allActions }, limitTriggers, limitActions } = require("../constants/");
const { deleteMessage } = require("./utils");

module.exports = async (message, gdb) => {
    const permissionLevel = getPermissionLevel(message.member), content = message.content;

    if (content.startsWith("!") && permissionLevel >= 1) return;

    let { count, user, modules, flows, users: scores, mutes } = gdb.get(), flowIDs = Object.keys(flows).slice(0, limitFlows);
    if (
        message.client.loading ||
        mutes[message.author.id]
    ) return deleteMessage(message);

    if (
        (!modules.includes("allow-spam") && message.author.id == user) ||
        (!modules.includes("talking") && content != (count + 1).toString()) ||
        content.split(" ")[0] != (count + 1).toString()
    ) {
        const countData = {
            count,
            score: scores[message.author.id] || 0,
            message,
            countingMessage: message,
            gdb
        };

        deleteMessage(message);

        for (const flowId of flowIDs) try {
            const flow = flows[flowId];
            if (flow.triggers.slice(0, limitTriggers).find((t) => t.type == "countfail"))
                for (const action of flow.actions.slice(0, limitActions).filter((a) => a)) try {
                    await allActions[action.type].run(countData, action.data);
                } catch (e) { };
        } catch (e) { };

        return;
    };

    count++;
    gdb.addToCount(message.member);

    let countingMessage = message;
    if (modules.includes("webhook")) try {
        let webhooks = await message.channel.fetchWebhooks(), webhook = webhooks.find((w) => w.name == "Counting");
        if (!webhook) webhook = await message.channel.createWebhook("Counting").catch(() => { });

        if (webhook) {
            countingMessage = await webhook.send({
                content: content,
                username: message.author.username,
                avatarURL: message.author.displayAvatarURL({ dynamic: true }),
                allowedMentions: {
                    users: [],
                    roles: [],
                    parse: [],
                }
            });
            deleteMessage(message);
        };
    } catch (e) { }
    else if (modules.includes("embed")) try {
        countingMessage = await message.channel.send({
            embeds: [{
                description: `${message.author}: ${content}`,
                color: message.member.displayColor || 3553598
            }]
        });
        deleteMessage(message);
    } catch (e) { };

    gdb.set("message", countingMessage.id);

    const countData = {
        count,
        score: scores[message.author.id] || 0,
        message,
        countingMessage,
        gdb
    };
    for (const flowID of flowIDs) try {
        const flow = flows[flowID]; let success;
        for (const trigger of flow.triggers.slice(0, limitTriggers).filter((t) => t)) {
            success = await allTriggers[trigger.type].check(countData, trigger.data);
            if (success) break;
        }
        if (success)
            for (const action of flow.actions.slice(0, limitActions).filter((a) => a)) try {
                await allActions[action.type].run(countData, action.data);
            } catch (e) { };
    } catch (e) { };
};