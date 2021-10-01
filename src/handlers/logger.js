const chalk = require("chalk"), { logChannel } = require("../../config");
let channel = require("../bot").client.channels.cache.get(logChannel);

module.exports = {
    log: (output) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        console.log(chalk.whiteBright(`[${timeFormatted} - INFO]`, output));
    },
    info: async (output, embedData = {}) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        console.log(chalk.whiteBright(`[${timeFormatted} - INFO]`, output));
        if (embedData.description && channel) await channel.send({
            content: `\`[${timeFormatted} - INFO]\``,
            embeds: [embedData]
        });
    },
    warn: async (output, embedData = {}) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        console.log(chalk.yellowBright(`[${timeFormatted} - WARN]`, output));
        if (embedData.description && channel) await channel.send({
            content: `\`[${timeFormatted} - WARN]\``,
            embeds: [embedData]
        });
    },
    error: async (output, embedData = {}) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        console.log(chalk.redBright(`[${timeFormatted} - ERROR]`, output));
        if (embedData.description && channel) await channel.send({
            content: `<@419892040726347776> \`[${timeFormatted} - ERROR]\``,
            embeds: [embedData]
        });
    }
};