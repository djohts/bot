import { ModifiedClient } from "../constants/types";
import { checkGuildBans } from "./utils";
import Util from "../util/Util";

export = (client: ModifiedClient) => {
    updatePresence(client);
    checkBans(client);
    tickMusicPlayers();
};

function updatePresence(client: ModifiedClient) {
    client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => {
        const gc = res.reduce((prev, curr) => prev + curr, 0);
        const aaaaaaa = gc <= 400 ? "400" : gc <= 500 ? "500" : gc <= 600 ? "600" : gc <= 700 ? "700" : gc <= 800 ? "800" : gc <= 900 ? "900" : "1000"
        client.user.setPresence({
            status: "idle",
            activities: [{ type: "PLAYING", name: `${aaaaaaa}? -> | ${gc} guilds` }],
        });
        setTimeout(() => updatePresence(client), 5 * 60 * 1000);
    });
};

function checkBans(client: ModifiedClient) {
    Promise.all(client.guilds.cache.map((guild) => checkGuildBans(guild)))
        .then(() => setTimeout(() => checkBans(client), 10 * 1000));
};

function tickMusicPlayers() {
    Promise.all(Util.lava.players.map((player) => Util.func.tickMusicPlayers(player)))
        .then(() => setTimeout(() => tickMusicPlayers(), 10 * 1000));
};