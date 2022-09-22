import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get information about the bot.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import { Client } from "discord-hybrid-sharding";
import { version } from "discord.js";
import Util from "../util/Util.js";
import prettyms from "pretty-ms";
import os from "os";
const platform = `${os.type()} (${os.release()})`;
let guilds = 0, users = 0, clusterCount = 0, shardCount = 0, memoryUsage = 0, memoryUsageGlobal = 0, nextUpdate = 0;

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guildId);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    if (nextUpdate < Date.now()) {
        nextUpdate = Date.now() + 10 * 1000;

        guilds = await interaction.client.cluster.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((prev, val) => prev + val, 0));
        users = await interaction.client.cluster.broadcastEval((bot) =>
            bot.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b, 0)
        ).then((res) => res.reduce((prev, val) => prev + val, 0));

        clusterCount = Client.getInfo().CLUSTER_COUNT;
        shardCount = Client.getInfo().TOTAL_SHARDS;

        const { rss, heapUsed } = process.memoryUsage();

        memoryUsageGlobal = rss;
        memoryUsage = heapUsed;
    };

    const clusterGuilds = interaction.client.guilds.cache.size;
    const clusterUsers = interaction.client.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b, 0);

    const shardId = interaction.guild.shard.id;
    const shardGuilds = interaction.client.guilds.cache.filter((g) => g.shard.id === shardId).size;
    const shardUsers = interaction.client.guilds.cache.filter((g) => g.shard.id === shardId).map((g) => g.memberCount).reduce((prev, val) => prev + val, 0);

    return interaction.reply({
        embeds: [{
            title: _("commands.info.title"),
            fields: [{
                name: _("commands.info.host"),
                value: [
                    _("commands.info.os", { platform }),
                    _("commands.info.library", { version }),
                    _("commands.info.clusters", { clusters: clusterCount.toLocaleString() }),
                    _("commands.info.shards", { shards: shardCount.toLocaleString() }),
                    _("commands.info.ram", { ram: Util.prettyBytes(memoryUsageGlobal, 2) })
                ].join("\n"),
                inline: true
            }, {
                name: _("commands.info.cluster", { id: interaction.client.cluster.id.toLocaleString() }),
                value: [
                    _("commands.info.guilds", { guilds: clusterGuilds.toLocaleString() }),
                    _("commands.info.users", { users: clusterUsers.toLocaleString() }),
                    _("commands.info.shards", { shards: interaction.client.cluster.ids.size.toLocaleString() }),
                    _("commands.info.ram", { ram: Util.prettyBytes(memoryUsage, 2) }),
                    _("commands.info.uptime", { uptime: prettyms(interaction.client.uptime) })
                ].join("\n"),
                inline: true
            }, {
                name: _("commands.info.shard", { id: shardId.toLocaleString() }),
                value: [
                    _("commands.info.guilds", { guilds: shardGuilds.toLocaleString() }),
                    _("commands.info.users", { users: shardUsers.toLocaleString() }),
                    _("commands.info.latency", { latency: interaction.guild.shard.ping.toLocaleString() })
                ].join("\n"),
                inline: true
            }, {
                name: _("commands.info.links"),
                value: [
                    _("commands.info.invite", {
                        link: [
                            "https://discord.com/oauth2/authorize",
                            `?client_id=${interaction.client.user.id}`,
                            "&scope=bot%20applications.commands",
                            "&permissions=1375450033182"
                        ].join("")
                    }),
                    _("commands.info.support", { link: "https://discord.gg/AaS4dwVHyA" }),
                    _("commands.info.website", { link: "https://dob.djoh.xyz" })
                ].join("\n"),
                inline: true
            }, {
                name: _("commands.info.stats"),
                value: [
                    _("commands.info.guilds", { guilds: guilds.toLocaleString() }),
                    _("commands.info.users", { users: users.toLocaleString() }),
                ].join("\n"),
                inline: true
            }]
        }]
    });
};