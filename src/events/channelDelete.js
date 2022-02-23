const { Client, VoiceChannel } = require("discord.js");

module.exports = {
    name: "channelDelete",

    run: async (client, channel) => {
        if (!(client instanceof Client)) return;
        if (!(channel instanceof VoiceChannel)) return;

        const player = client.manager.get(channel.guild.id);

        if (
            player &&
            player.voiceChannel == channel.id
        ) {
            client.channels.cache.get(player.textChannel)?.send("Канал был удалён. Останавливаю плеер.");
            player.destroy();
        };
    }
};