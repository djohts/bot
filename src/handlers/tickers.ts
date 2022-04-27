import { ModifiedClient } from "../constants/types";
import { checkGuildBans } from "./utils";

export = (client: ModifiedClient) => {
    updatePresence(client);
    checkBans(client);
};

function updatePresence(client: ModifiedClient) {
    client.shard.broadcastEval((bot) => bot.guilds.cache.size).then((res) => {
        const gc = res.reduce((prev, curr) => prev + curr, 0);
        client.user.setPresence({
            status: "idle",
            activities: [{ type: "PLAYING", name: `500? -> | ${gc} guilds` }],
        });
        setTimeout(() => updatePresence(client), 5 * 60 * 1000);
    });
};

function checkBans(client: ModifiedClient) {
    Promise.all(client.guilds.cache.map(async (guild) => await checkGuildBans(guild)))
        .then(() => setTimeout(() => checkBans(client), 10 * 1000));
};