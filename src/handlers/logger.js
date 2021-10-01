const chalk = require("chalk"), { logChannel } = require("../../config");
let channel = require("../bot").client.channels.cache.get(logChannel);

module.exports = {
    log: (output, embedData = {}) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        if (embedData && channel) channel.send({
            content: `\`[${timeFormatted} - INFO]\``,
            embeds: [embedData]
        });
        console.log(chalk.whiteBright(`[${timeFormatted} - INFO]`, output));
    },
    warn: (output, embedData = {}) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        if (embedData && channel) channel.send({
            content: `\`[${timeFormatted} - WARN]\``,
            embeds: [embedData]
        });
        console.log(chalk.yellowBright(`[${timeFormatted} - WARN]`, output));
    },
    error: (output, embedData = {}) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        if (embedData && channel) channel.send({
            content: `<@419892040726347776> \`[${timeFormatted} - ERROR]\``,
            embeds: [embedData]
        });
        console.log(chalk.redBright(`[${timeFormatted} - ERROR]`, output));
    }
};