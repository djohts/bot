"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const utils_1 = require("./utils");
const pretty_ms_1 = __importDefault(require("pretty-ms"));
const discord_js_1 = require("discord.js");
const Util_1 = __importDefault(require("../util/Util"));
module.exports = async (guild) => {
    const gdb = await Util_1.default.database.guild(guild.id);
    await Util_1.default.func.checkGuildBans(guild);
    const { channel: channelId, message: messageId } = gdb.get();
    let alert;
    try {
        const channel = guild.channels.cache.get(channelId);
        if (channel instanceof discord_js_1.TextChannel &&
            channel.permissionsFor(guild.members.me).has(discord_js_1.PermissionFlagsBits.ViewChannel) &&
            channel.permissionsFor(guild.members.me).has(discord_js_1.PermissionFlagsBits.ManageMessages) &&
            channel.permissionsFor(guild.members.me).has(discord_js_1.PermissionFlagsBits.SendMessages)) {
            let messages = await channel.messages.fetch({ limit: 100, after: messageId });
            if (messages.size) {
                alert = await channel.send("💢 Идёт подготовка канала.").catch(() => null);
                const defaultPermissions = channel.permissionOverwrites.cache.get(guild.roles.everyone.id) || { allow: new Set(), deny: new Set() };
                let oldPermission = null;
                if (defaultPermissions.allow.has(discord_js_1.PermissionFlagsBits.SendMessages))
                    oldPermission = true;
                else if (defaultPermissions.deny.has(discord_js_1.PermissionFlagsBits.SendMessages))
                    oldPermission = false;
                if (oldPermission)
                    channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => null);
                let processing = true, fail = false;
                let preparationStart = Date.now();
                const filter = (message) => message.id !== alert.id &&
                    message.createdTimestamp > Date.now() - 14 * 24 * 60 * 60 * 1000;
                while (processing && !fail) {
                    messages = messages.filter(filter);
                    console.log(messages);
                    if (!messages.size)
                        processing = false;
                    else {
                        await channel.bulkDelete(messages, true).catch(() => fail = true);
                        await alert.edit(`💢 Идёт подготовка канала. **\`[${(0, pretty_ms_1.default)(Date.now() - preparationStart)}]\`**`).catch(() => null);
                    }
                    ;
                    if (processing && !fail) {
                        messages = await channel.messages.fetch({ limit: 100, after: messageId }).catch(() => { fail = true; return null; });
                        if (messages?.filter(filter).size)
                            await sleep(3500);
                    }
                    ;
                }
                ;
                if (oldPermission)
                    channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: oldPermission }).catch(() => null);
                if (fail)
                    await alert.edit("❌ Что-то пошло не так при подготовке канала.").catch(() => null);
                else
                    await alert.edit(`🔰 Канал готов! **\`[${(0, pretty_ms_1.default)(Date.now() - preparationStart)}]\`**`)
                        .then(() => setTimeout(() => (0, utils_1.deleteMessage)(alert), 10 * 1000))
                        .catch(() => null);
            }
            ;
        }
        ;
    }
    catch (e) {
        console.error(e);
        alert.edit("❌ Что-то пошло не так при подготовке канала.")
            .then(() => setTimeout(() => (0, utils_1.deleteMessage)(alert), 10 * 1000))
            .catch(() => null);
    }
    ;
};
