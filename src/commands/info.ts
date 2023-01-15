import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get information about the bot.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction, version } from "discord.js";
import { getInfo } from "discord-hybrid-sharding";
import { getGuildDocument } from "../database";
import prettyms from "pretty-ms";
import i18next from "i18next";
import os from "os";

const platform = `${os.type()} (${os.release()})`;
let guilds = 0, users = 0, clusterCount = 0, shardCount = 0, memoryUsage = 0, memoryUsageGlobal = 0, nextUpdate = 0;

export const run = async (interaction: ChatInputCommandInteraction<"cached">) => {
    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT<any, any>(document.locale, null, "commands.info");
    const { util: Util } = interaction.client;

    if (nextUpdate < Date.now()) {
        nextUpdate = Date.now() + 10 * 1000;

        guilds = await interaction.client.cluster.broadcastEval((bot) => bot.guilds.cache.size).then((res) => res.reduce((prev, val) => prev + val, 0));
        users = await interaction.client.cluster.broadcastEval((bot) =>
            bot.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b, 0)
        ).then((res) => res.reduce((prev, val) => prev + val, 0));

        clusterCount = getInfo().CLUSTER_COUNT;
        shardCount = getInfo().TOTAL_SHARDS;

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
            title: t("title"),
            fields: [{
                name: t("host"),
                value: [
                    t("os", { platform }),
                    t("library", { version }),
                    t("clusters", { clusters: clusterCount.toLocaleString() }),
                    t("shards", { shards: shardCount.toLocaleString() }),
                    t("ram", { ram: Util.prettyBytes(memoryUsageGlobal, 2) })
                ].join("\n"),
                inline: true
            }, {
                name: t("cluster", { id: interaction.client.cluster.id.toLocaleString() }),
                value: [
                    t("guilds", { guilds: clusterGuilds.toLocaleString() }),
                    t("users", { users: clusterUsers.toLocaleString() }),
                    t("shards", { shards: interaction.client.cluster.ids.size.toLocaleString() }),
                    t("ram", { ram: Util.prettyBytes(memoryUsage, 2) }),
                    t("uptime", { uptime: prettyms(interaction.client.uptime) })
                ].join("\n"),
                inline: true
            }, {
                name: t("shard", { id: shardId.toLocaleString() }),
                value: [
                    t("guilds", { guilds: shardGuilds.toLocaleString() }),
                    t("users", { users: shardUsers.toLocaleString() }),
                    t("latency", { latency: interaction.guild.shard.ping.toLocaleString() })
                ].join("\n"),
                inline: true
            }, {
                name: t("links"),
                value: [
                    t("invite", {
                        link: [
                            "https://discord.com/oauth2/authorize",
                            `?client_id=${interaction.client.user.id}`,
                            "&scope=bot%20applications.commands",
                            "&permissions=275683601438"
                        ].join("")
                    }),
                    t("support", { link: "https://discord.gg/AaS4dwVHyA" }),
                    t("website", { link: "https://dob.djoh.xyz" })
                ].join("\n"),
                inline: true
            }, {
                name: t("stats"),
                value: [
                    t("guilds", { guilds: guilds.toLocaleString() }),
                    t("users", { users: users.toLocaleString() }),
                ].join("\n"),
                inline: true
            }]
        }]
    });
};