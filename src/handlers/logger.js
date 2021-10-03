const chalk = require("chalk"), { logChannel } = require("../../config"), { MessageEmbed } = require("discord.js");

module.exports = {
    log: async (output, embedData = new MessageEmbed) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        console.log(chalk.whiteBright(`[${timeFormatted} - INFO]`, output));
        if (output.includes("Manager")) return;

        let channel = require("../bot").client.channels.cache.get(logChannel);

        if (embedData.description && channel) return await channel.send({
            content: `\`[${timeFormatted} - INFO]\``,
            embeds: [embedData]
        });
    },
    warn: async (output, embedData = new MessageEmbed) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        console.log(chalk.yellowBright(`[${timeFormatted} - WARN]`, output));
        let channel = require("../bot").client.channels.cache.get(logChannel);
        if (embedData.description && channel) await channel.send({
            content: `\`[${timeFormatted} - WARN]\``,
            embeds: [embedData]
        });
    },
    error: async (output, embedData = new MessageEmbed) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        console.log(chalk.redBright(`[${timeFormatted} - ERROR]`, output));
        if (output.includes("Manager")) return;

        let channel = require("../bot").client.channels.cache.get(logChannel);

        if (embedData.description && channel) return await channel.send({
            content: `<@419892040726347776> \`[${timeFormatted} - ERROR]\``,
            embeds: [embedData]
        });
    }
};