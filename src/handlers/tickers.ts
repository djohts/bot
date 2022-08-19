import { ActionRowBuilder, ActivityType, ButtonBuilder, ButtonStyle, TextChannel } from "discord.js";
import { BcBotBumpAction } from "../constants/types";
import Util from "../util/Util";
import { UserFetcher } from "./bottleneck";
import { clientLogger } from "../util/logger/normal";

export = () => {
    updatePresence();
    checkBans();
    tickMusicPlayers();
    updateGuildStatsChannels();
    if (Util.client.cluster.id === 0) processBotBumps();
};

function updatePresence() {
    Util.client.cluster.broadcastEval((bot) => bot.guilds.cache.size).then((res) => {
        const gc = res.reduce((prev, curr) => prev + curr, 0);
        const aaaaaaa = gc <= 400 ? "400" : gc <= 500 ? "500" : gc <= 600 ? "600" : gc <= 700 ? "700" : gc <= 800 ? "800" : gc <= 900 ? "900" : "1000"
        Util.client.user.setPresence({
            status: "idle",
            activities: [{ type: ActivityType.Playing, name: Util.client.ptext ?? `${aaaaaaa}? -> | ${gc} guilds` }],
        });
        setTimeout(() => updatePresence(), 1 * 60 * 1000);
    });
};

function checkBans() {
    Promise.all(Util.client.guilds.cache.map((guild) => Util.func.checkGuildBans(guild)))
        .then(() => setTimeout(() => checkBans(), 10 * 1000));
};

function tickMusicPlayers() {
    if (Util.lava) Promise.all(Util.lava.players.map((player) => Util.func.tickMusicPlayers(player)))
        .then(() => setTimeout(() => tickMusicPlayers(), 10 * 1000));
    else setTimeout(() => tickMusicPlayers(), 10 * 1000);
};

function updateGuildStatsChannels() {
    Promise.all(Util.client.guilds.cache.map((guild) => Util.func.updateGuildStatsChannels(guild.id)))
        .then(() => setTimeout(() => updateGuildStatsChannels(), 10 * 60 * 1000));
};

function processBotBumps() {
    Util.database.global().then((global) => {
        Promise.all(global.get().boticordBumps.map(async (data) => {
            try {
                const delay = 6 * 60 * 60 * 1000;
                if (data.at + delay > Date.now()) return;
                global.removeFromArray("boticordBumps", data);
                const udb = await Util.database.users(data.user);

                if (udb.isSubscribed("boticord")) {
                    const fetchUser = (data: BcBotBumpAction["data"]) => Util.client.users.fetch(data.user);
                    const user = await UserFetcher.schedule(fetchUser, data);

                    let dmsent = false;

                    await user.send({
                        embeds: [{
                            title: "Мониторинг",
                            description: "Вы можете снова апнуть бота на `boticord.top`.",
                        }],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                new ButtonBuilder()
                                    .setLabel("Апнуть бота")
                                    .setStyle(ButtonStyle.Link)
                                    .setURL("https://boticord.top/bot/889214509544247306")
                            )
                        ]
                    }).then(() => { dmsent = true; }).catch(() => null);

                    if (dmsent) {
                        await Util.func.uselesslog({ content: `sent boticord up notification to ${user.tag} ${user} (\`${user.id}\`)` });
                    } else {
                        const channel = Util.client.channels.cache.get("970267545548509255") as TextChannel;

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
                                new ActionRowBuilder<ButtonBuilder>().addComponents(
                                    new ButtonBuilder()
                                        .setLabel("Апнуть бота")
                                        .setStyle(ButtonStyle.Link)
                                        .setURL("https://boticord.top/bot/889214509544247306")
                                )
                            ]
                        });
                    };
                };
            } catch (e) { clientLogger.error(e); };
        })).then(() => setTimeout(() => processBotBumps(), 30 * 1000));
    });
};