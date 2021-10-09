const chalk = require("chalk"), { log: { id, token } } = require("../../config"), { MessageEmbed, WebhookClient } = require("discord.js");
const log = new WebhookClient(id, token);

module.exports = {
    log: async (output, embedData = new MessageEmbed) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        console.log(chalk.whiteBright(`[${timeFormatted} - INFO]`, output));
        if (output.includes("Manager")) return;

        if (embedData.description && log) return await log.send({
            content: `\`[${timeFormatted} - INFO]\``,
            embeds: [embedData]
        });
    },
    warn: async (output, embedData = new MessageEmbed) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        console.log(chalk.yellowBright(`[${timeFormatted} - WARN]`, output));

        if (embedData.description && log) await log.send({
            content: `\`[${timeFormatted} - WARN]\``,
            embeds: [embedData]
        });
    },
    error: async (output, embedData = new MessageEmbed) => {
        const timeFormatted = new Date().toLocaleTimeString("ru-RU", { hour12: false });
        console.log(chalk.redBright(`[${timeFormatted} - ERROR]`, output));
        if (output.includes("Manager")) return;

        if (embedData.description && log) return await log.send({
            content: `<@419892040726347776> \`[${timeFormatted} - ERROR]\``,
            embeds: [embedData]
        });
    }
};