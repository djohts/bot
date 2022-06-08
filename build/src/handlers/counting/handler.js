"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const flow_1 = require("../../constants/flows/flow");
const { triggers: allTriggers, actions: allActions } = flow_1.flow;
const constants_1 = require("../../constants");
const flows_1 = __importDefault(require("../../constants/flows/"));
const { limitFlows, limitTriggers, limitActions } = flows_1.default;
const utils_1 = require("./../utils");
const database_1 = __importDefault(require("../../database/"));
module.exports = async (message) => {
    const gdb = await database_1.default.guild(message.guild.id);
    const permissionLevel = (0, constants_1.getPermissionLevel)(message.member), content = message.content;
    if (content.startsWith("!") && permissionLevel >= 1)
        return;
    let { count, user, modules, flows, users: scores } = gdb.get(), flowIDs = Object.keys(flows).slice(0, limitFlows);
    if (message.client.loading)
        return (0, utils_1.deleteMessage)(message);
    if ((!modules.includes("allow-spam") && message.author.id === user) ||
        (!modules.includes("talking") && content !== `${count + 1}`) ||
        content.split(/\s/)[0] !== `${count + 1}`) {
        const countData = {
            count,
            score: scores[message.author.id] || 0,
            message,
            countingMessage: message,
            gdb
        };
        (0, utils_1.deleteMessage)(message);
        for (const flowId of flowIDs)
            try {
                const flow = flows[flowId];
                if (flow.triggers.slice(0, limitTriggers).find((t) => t.type === "countfail"))
                    for (const action of flow.actions.slice(0, limitActions).filter((a) => a))
                        try {
                            await allActions[action.type].run(countData, action.data);
                        }
                        catch (e) { }
                ;
            }
            catch (e) { }
        ;
        return;
    }
    ;
    count++;
    gdb.addToCount(message.member);
    let countingMessage = message;
    if (message.channel.type === "DM" ||
        message.channel instanceof discord_js_1.ThreadChannel)
        return;
    if (modules.includes("webhook"))
        try {
            const webhooks = await message.channel.fetchWebhooks();
            let webhook = webhooks.find((w) => w.name === "Counting");
            if (!webhook)
                webhook = await message.channel.createWebhook("Counting");
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
                (0, utils_1.deleteMessage)(message);
            }
            ;
        }
        catch (e) { }
    else if (modules.includes("embed"))
        try {
            countingMessage = await message.channel.send({
                embeds: [{
                        description: `${message.author}: ${content}`,
                        color: message.member.displayColor || 3553598
                    }]
            });
            (0, utils_1.deleteMessage)(message);
        }
        catch (e) { }
    ;
    gdb.set("message", countingMessage.id);
    const countData = {
        count,
        score: scores[message.author.id] || 0,
        message,
        countingMessage,
        gdb
    };
    for (const flowID of flowIDs)
        try {
            const flow = flows[flowID];
            let success;
            for (const trigger of flow.triggers.slice(0, limitTriggers).filter((t) => t)) {
                success = await allTriggers[trigger.type].check(countData, trigger.data);
                if (success)
                    break;
            }
            ;
            if (success)
                for (const action of flow.actions.slice(0, limitActions).filter((a) => a))
                    try {
                        await allActions[action.type].run(countData, action.data);
                    }
                    catch (e) { }
            ;
        }
        catch (e) { }
    ;
};
