const { Client } = require("discord.js");
const { voicesJoin, voicesLeave, voicesSwitch } = require("../constants/");

module.exports = (client = new Client) => {
    client.on("voiceChannelJoin", voicesJoin);
    client.on("voiceChannelLeave", voicesLeave);
    client.on("voiceChannelSwitch", voicesSwitch);
};