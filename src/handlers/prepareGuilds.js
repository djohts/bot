const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const parseMs = require("pretty-ms");

module.exports = async (guild, db) => {
    const gdb = await db.guild(guild.id);
    const { channel: channelId, message: messageId } = gdb.get();
    let alert = null;

    try {
        let channel = guild.channels.cache.get(channelId);
        if (channel) {
            let messages = await channel.messages.fetch({ limit: 100, after: messageId }).catch(() => { });
            if (messages.size) {
                alert = await channel.send("💢 Идёт подготовка канала.").catch(() => { });
                const defaultPermissions = channel.permissionOverwrites.cache.get(guild.roles.everyone) || { allow: new Set(), deny: new Set() };
                let oldPermission = null;
                if (defaultPermissions.allow.has("SEND_MESSAGES")) oldPermission = true;
                else if (defaultPermissions.deny.has("SEND_MESSAGES")) oldPermission = false;

                if (oldPermission) await channel.permissionOverwrites.edit(guild.roles.everyone, { SEND_MESSAGES: false }, "Подготовка канала.");

                let processing = true, fail = false;
                let preparationStart = Date.now();
                while (processing && !fail) {
                    messages = messages.filter((m) => m.id != alert.id);
                    if (!messages.size) processing = false;
                    else {
                        await channel.bulkDelete(messages).catch(() => fail = true);
                        await alert?.edit(`💢 Идёт подготовка канала. **\`[${parseMs(Date.now() - preparationStart)}]\`**`);
                    };
                    if (processing && !fail) {
                        messages = await channel.messages.fetch({ limit: 100, after: messageId }).catch(() => fail = true);
                        if (messages.filter((m) => m.id != alert.id).size) await sleep(3500);
                    };
                };

                if (oldPermission) await channel.permissionOverwrites.edit(guild.roles.everyone, { SEND_MESSAGES: oldPermission });
                if (fail) alert?.edit("❌ Что-то пошло не так при подготовке канала.");
                else alert?.edit(`🔰 Канал готов! **\`[${parseMs(Date.now() - preparationStart)}]\`**`) && setTimeout(() => alert.delete().catch(() => { }), 20000);
            };
        };
    } catch (e) {
        await alert?.edit("❌ Что-то пошло не так при подготовке канала.");
    };
};