import Util from "../util/Util";

export = () => {
    updatePresence();
    checkBans();
    tickMusicPlayers();
    updateGuildStatsChannels();
};

function updatePresence() {
    Util.client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => {
        const gc = res.reduce((prev, curr) => prev + curr, 0);
        const aaaaaaa = gc <= 400 ? "400" : gc <= 500 ? "500" : gc <= 600 ? "600" : gc <= 700 ? "700" : gc <= 800 ? "800" : gc <= 900 ? "900" : "1000"
        Util.client.user.setPresence({
            status: "idle",
            activities: [{ type: "PLAYING", name: `${aaaaaaa}? -> | ${gc} guilds` }],
        });
        setTimeout(() => updatePresence(), 5 * 60 * 1000);
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