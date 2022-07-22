"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const Util_1 = __importDefault(require("../util/Util"));
const bottleneck_1 = require("./bottleneck");
function updatePresence() {
    Util_1.default.client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => {
        const gc = res.reduce((prev, curr) => prev + curr, 0);
        const aaaaaaa = gc <= 400 ? "400" : gc <= 500 ? "500" : gc <= 600 ? "600" : gc <= 700 ? "700" : gc <= 800 ? "800" : gc <= 900 ? "900" : "1000";
        Util_1.default.client.user.setPresence({
            status: "idle",
            activities: [{ type: "PLAYING", name: `${aaaaaaa}? -> | ${gc} guilds` }],
        });
        setTimeout(() => updatePresence(), 5 * 60 * 1000);
    });
}
;
function checkBans() {
    Promise.all(Util_1.default.client.guilds.cache.map((guild) => Util_1.default.func.checkGuildBans(guild)))
        .then(() => setTimeout(() => checkBans(), 10 * 1000));
}
;
function tickMusicPlayers() {
    if (Util_1.default.lava)
        Promise.all(Util_1.default.lava.players.map((player) => Util_1.default.func.tickMusicPlayers(player)))
            .then(() => setTimeout(() => tickMusicPlayers(), 10 * 1000));
    else
        setTimeout(() => tickMusicPlayers(), 10 * 1000);
}
;
function updateGuildStatsChannels() {
    Promise.all(Util_1.default.client.guilds.cache.map((guild) => Util_1.default.func.updateGuildStatsChannels(guild.id)))
        .then(() => setTimeout(() => updateGuildStatsChannels(), 10 * 60 * 1000));
}
;
function processBotBumps() {
    Util_1.default.database.global().then(async (global) => {
        await Promise.all(global.get().boticordBumps.map(async (data) => {
            try {
                const delay = 2 * 60 * 60 * 1000;
                if (data.at + delay > Date.now())
                    return;
                global.removeFromArray("boticordBumps", data);
                const udb = await Util_1.default.database.users(data.user);
                await udb.reload();
                if (udb.isSubscribed("boticord")) {
                    const fetchUser = (data) => Util_1.default.client.users.fetch(data.user).catch(() => null);
                    const user = await bottleneck_1.UserFetcher.schedule(fetchUser, data);
                    let dmsent = false;
                    await user.send({
                        embeds: [{
                                title: "Мониторинг",
                                description: "Вы можете снова апнуть бота на `boticord.top`.",
                            }],
                        components: [
                            new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton().setLabel("Апнуть бота").setStyle("LINK").setURL("https://boticord.top/bot/889214509544247306"))
                        ]
                    }).then(async () => { dmsent = true; }).catch(() => null);
                    if (dmsent) {
                        await Util_1.default.func.uselesslog({ content: `sent boticord up notification to ${user.tag} ${user} (\`${user.id}\`)` });
                    }
                    else {
                        const channel = Util_1.default.client.channels.cache.get("957937585999736858");
                        await channel.send({
                            content: `${user},`,
                            embeds: [{
                                    title: "Мониторинг",
                                    description: [
                                        "Вы можете снова апнуть бота на `boticord.top`.",
                                        "Нажав на кнопку ниже, вы подпишетесь на уведомления о возможности поднимать в рейтинге нашего бота.",
                                        "Дайте боту возможность писать вам в личные сообщения, посредством удаления из чёрного списка бота или выдавая доступ на общих серверах с ботом писать в личные сообщения пользователям без добавления в друзья"
                                    ].join("\n"),
                                    image: {
                                        url: "https://cdn.discordapp.com/attachments/768041170076827648/999436594664702012/UR4yHOER.gif"
                                    }
                                }],
                            components: [
                                new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton().setLabel("Апнуть бота").setStyle("LINK").setURL("https://boticord.top/bot/889214509544247306"))
                            ]
                        });
                    }
                    ;
                }
                ;
            }
            catch (e) {
                console.error(e);
            }
            ;
        })).then(() => setTimeout(() => processBotBumps(), 30 * 1000));
    });
}
;
module.exports = () => {
    updatePresence();
    checkBans();
    tickMusicPlayers();
    updateGuildStatsChannels();
    if (Util_1.default.client.shard.ids[0] === 0)
        processBotBumps();
};
