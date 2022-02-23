const { Client, Message } = require("discord.js");
const db = require("../database/")();

module.exports = {
    name: "messageDelete",

    run: async (client, deleted) => {
        if (!(client instanceof Client)) return;
        if (!(deleted instanceof Message)) return;

        const gdb = await db.guild(deleted.guild.id);
        const { modules, channel, message, user, count } = gdb.get();
        if (
            channel == deleted.channel.id &&
            message == deleted.id &&
            !modules.includes("embed") &&
            !modules.includes("webhook")
        ) {
            const newMessage = await deleted.channel.send(`${deleted.author || `<@${user}>`}: ${deleted.content || count}`);
            gdb.set("message", newMessage.id);
        };
    }
};