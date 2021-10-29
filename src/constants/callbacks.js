const { GuildMember, VoiceChannel } = require("discord.js");
const db = require("../database/")();

module.exports.voicesJoin = async (member = new GuildMember, channel = new VoiceChannel) => {
    const gset = await db.settings(member.guild.id);
    if (!gset.get().voices.enabled) return;
    if (gset.get().voices.lobby != channel.id) return;
    const guilddb = await db.guild(member.guild.id);

    member.guild.channels.create("Комната " + member.user.tag, {
        type: "GUILD_VOICE",
        parent: channel.parentId
    }).then((ch) => {
        member.voice.setChannel(ch.id) && guilddb.setOnObject("voices", ch.id, member.user.id);
    }).catch(() => { });
};

module.exports.voicesLeave = async (member = new GuildMember, channel = new VoiceChannel) => {
    const guilddb = await db.guild(member.guild.id);

    if (guilddb.get().voices[channel.id] == member.user.id) {
        channel.delete() && guilddb.removeFromObject("voices", channel.id);
    };
};

module.exports.voicesSwitch = async (member = new GuildMember, oldChannel = new VoiceChannel, newChannel = new VoiceChannel) => {
    const gset = await db.settings(member.guild.id);
    const guilddb = await db.guild(member.guild.id);

    if (guilddb.get().voices[oldChannel.id] == member.user.id) {
        oldChannel.delete() && guilddb.removeFromObject("voices", oldChannel.id);
    };
    if (gset.get().voices.lobby == newChannel.id && gset.get().voices.enabled) {
        member.guild.channels.create("Комната " + member.user.tag, {
            type: "GUILD_VOICE",
            parent: newChannel.parentId
        }).then((ch) => {
            member.voice.setChannel(ch.id) && guilddb.setOnObject("voices", ch.id, member.user.id);
        }).catch(() => { });
    };
};