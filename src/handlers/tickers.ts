import { ActionRowBuilder, ActivityType, ButtonBuilder, ButtonStyle } from "discord.js";
import { clientLogger } from "../util/logger/normal";
// import { inspect } from "node:util";
import config from "../../config";
import Util from "../util/Util";

export = () => {
    updatePresence();
    checkBans();
    // tickMusicPlayers();
    updateGuildStatsChannels();
    if (
        Util.client.cluster.id === 0
        && (
            config.monitoring.bc
            || config.monitoring.sdc
        )
    ) processBotBumps();
};

function updatePresence() {
    Util.client.cluster.broadcastEval((bot) => bot.guilds.cache.size).then((res) => {
        const gc = res.reduce((prev, curr) => prev + curr, 0);
        const a = gc < 400 ? "400" : gc < 500 ? "500" : gc < 600 ? "600" : gc < 700 ? "700" : gc < 800 ? "800" : gc < 900 ? "900" : "1000";
        const formatted = gc.toLocaleString();

        Util.client.user.setPresence({
            status: "online",
            activities: [{ type: ActivityType.Playing, name: Util.client.ptext?.replace(/{{gc}}/gi, formatted) ?? `${a}? -> | ${formatted} guilds` }],
        });
        setTimeout(() => updatePresence(), 1 * 60 * 1000);
    });
};

function checkBans() {
    Promise.all(Util.client.guilds.cache.map((guild) => Util.func.checkGuildBans(guild)))
        .then(() => void setTimeout(() => checkBans(), 10 * 1000));
};

// function tickMusicPlayers() {
//     if (Util.lava) Promise.all(Util.lava.players.map((player) => Util.func.tickMusicPlayer(player)))
//         .then(() => void setTimeout(() => tickMusicPlayers(), 5 * 1000))
//         .catch((e) => {
//             clientLogger.error(inspect(e));
//             setTimeout(() => tickMusicPlayers(), 5 * 1000)
//         });
//     else setTimeout(() => tickMusicPlayers(), 5 * 1000);
// };

function updateGuildStatsChannels() {
    Promise.all(Util.client.guilds.cache.map((guild) => Util.func.updateGuildStatsChannels(guild.id)))
        .then(() => void setTimeout(() => updateGuildStatsChannels(), 10 * 60 * 1000));
};

function processBotBumps() {
    Util.database.global().then((global) => {
        Promise.all(global.get().boticordBumps.map(async (data) => {
            try {
                if (data.next > Date.now()) return;

                global.removeFromArray("boticordBumps", data);
                const udb = await Util.database.users(data.user);

                if (udb.isSubscribed("boticord")) {
                    await Util.client.users.send(data.user, {
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
                    })
                        .then((m) => {
                            if (m.channel.isDMBased()) {
                                const user = m.channel.recipient;

                                return Util.func.uselesslog({
                                    content: `sent boticord up notification to ${user.tag} ${user} (\`${user.id}\`)`
                                });
                            };
                        })
                        .catch((a) => null);
                };
            } catch (e) { clientLogger.error(e); };
        })).then(() => void setTimeout(() => processBotBumps(), 30 * 1000));
    });
};