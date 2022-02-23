const { Client } = require("discord.js");
const { Manager } = require("erela.js");
const Spotify = require("erela.js-spotify");
const { lava: { nodes, spotify: { clientID, clientSecret } } } = require("../../config");

module.exports = (client) => {
    if (!(client instanceof Client)) return;

    return new Manager({
        nodes: nodes,
        plugins: [new Spotify({ clientID, clientSecret })],
        send(id, payload) {
            client.guilds.cache.get(id)?.shard.send(payload);
        }
    })
        .on("trackError", console.log)
        .on("trackStuck", console.log)
        .on("nodeConnect", ({ options }) => console.log(`${client.s} Lava ${options.host}:${options.port} connected.`))
        .on("nodeError", ({ options }, error) => console.log(`${client.s} Lava ${options.host}:${options.port} had an error: ${error.message}`))
        .on("trackStart", (player, track) => {
            const voice = client.channels.cache.get(player.voiceChannel);
            const text = client.channels.cache.get(player.textChannel);

            if (!voice?.members.filter((m) => m.user.id != client.user.id).size)
                return text?.send("Все участники покинули голосовой канал. Останавливаю плеер.") && player.destroy();

            text.send(`Играю:\n\`${track.title}\``);
        })
        .on("queueEnd", (player) => {
            client.channels.cache.get(player.textChannel)?.send("Очередь пуста. Останавливаю плеер.");

            player.destroy();
        })
        .init(client.user.id);
};