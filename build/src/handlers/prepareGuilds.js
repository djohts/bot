"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const utils_1 = require("./utils");
const pretty_ms_1 = __importDefault(require("pretty-ms"));
const discord_js_1 = require("discord.js");
const database_1 = __importDefault(require("../database/"));
module.exports = async (guild) => {
    const gdb = await database_1.default.guild(guild.id);
    const { channel: channelId, message: messageId } = gdb.get();
    let alert;
    try {
        const channel = guild.channels.cache.get(channelId);
        if (channel instanceof discord_js_1.TextChannel) {
            let messages = await channel.messages.fetch({ limit: 100, after: messageId });
            if (messages.size) {
                alert = await channel.send("💢 Идёт подготовка канала.").catch(() => null);
                const defaultPermissions = channel.permissionOverwrites.cache.get(guild.roles.everyone.id) || { allow: new Set(), deny: new Set() };
                let oldPermission = null;
                if (defaultPermissions.allow.has("SEND_MESSAGES"))
                    oldPermission = true;
                else if (defaultPermissions.deny.has("SEND_MESSAGES"))
                    oldPermission = false;
                if (oldPermission)
                    await channel.permissionOverwrites.edit(guild.roles.everyone, { SEND_MESSAGES: false }).catch(() => null);
                let processing = true, fail = false;
                let preparationStart = Date.now();
                while (processing && !fail) {
                    messages = messages.filter((m) => m.id != alert.id && m.id != messageId);
                    if (!messages.size)
                        processing = false;
                    else {
                        await channel.bulkDelete(messages).catch(() => fail = true);
                        await alert?.edit(`💢 Идёт подготовка канала. **\`[${(0, pretty_ms_1.default)(Date.now() - preparationStart)}]\`**`).catch(() => null);
                    }
                    ;
                    if (processing && !fail) {
                        messages = await channel.messages.fetch({ limit: 100, after: messageId }).catch(() => { fail = true; return null; });
                        if (messages.filter((m) => m.id != alert.id).size)
                            await sleep(3500);
                    }
                    ;
                }
                ;
                if (oldPermission)
                    await channel.permissionOverwrites.edit(guild.roles.everyone, { SEND_MESSAGES: oldPermission }).catch(() => null);
                if (fail)
                    await alert?.edit("❌ Что-то пошло не так при подготовке канала.").catch(() => null);
                else
                    await alert?.edit(`🔰 Канал готов! **\`[${(0, pretty_ms_1.default)(Date.now() - preparationStart)}]\`**`)
                        .then(() => setTimeout(() => (0, utils_1.deleteMessage)(alert), 10 * 1000))
                        .catch(() => null);
            }
            ;
        }
        ;
    }
    catch (e) {
        console.log(e);
        alert?.edit("❌ Что-то пошло не так при подготовке канала.")
            .then(() => setTimeout(() => (0, utils_1.deleteMessage)(alert), 10 * 1000))
            .catch(() => null);
    }
    ;
};
