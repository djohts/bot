import { ActionRowBuilder, ActivityType, AttachmentBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from "discord.js";
import { getGlobalDocument, getGuildDocument, getUserDocument } from "../database";
import { clientLogger } from "../utils/logger/cluster";
import { readFileSync } from "node:fs";
import { isEqual } from "lodash";
import config from "../constants/config";
import Util from "../utils/Util";
import svg2img from "svg2img";
import axios from "axios";

export = () => {
    updatePresence();
    checkBans();
    updateGuildStatsChannels();
    updateSirenMaps();
    if (
        Util.client.cluster.id === 0
        && config.monitoring.bc
    ) processBotBumps();
};

function updatePresence() {
    Util.client.cluster.broadcastEval((bot) => bot.guilds.cache.size).then((res) => {
        const gc = res.reduce((prev, curr) => prev + curr, 0);
        const a = gc < 500 ? "500" : gc < 600 ? "600" : gc < 700 ? "700" : gc < 800 ? "800" : gc < 900 ? "900" : "1000";
        const formatted = gc.toLocaleString();

        Util.client.user.setPresence({
            status: "online",
            activities: [{ type: ActivityType.Playing, name: Util.client.ptext?.replace(/{{gc}}/gi, formatted) ?? `${a}? -> | ${formatted} guilds` }],
        });
        setTimeout(() => updatePresence(), 1 * 60 * 1000);
    });
};

function checkBans() {
    Promise.all(Util.client.guilds.cache.map((guild) => Util.func.checkGuildBans(guild)))
        .then(() => void setTimeout(() => checkBans(), 10 * 1000));
};

function updateGuildStatsChannels() {
    Promise.all(Util.client.guilds.cache.map((guild) => Util.func.updateGuildStatsChannels(guild.id)))
        .then(() => void setTimeout(() => updateGuildStatsChannels(), 10 * 60 * 1000));
};

let prevData: SirenApiResponse | null = null;
function updateSirenMaps() {
    axios.get<SirenApiResponse>(config.sirens_api).then((res) => {
        const data = res.data;
        if (isEqual(data, prevData)) return void setTimeout(() => updateSirenMaps(), 1000 * 30);

        prevData = data;

        let xml = readFileSync(__dirname + "/../../files/ua-map.svg", { encoding: "utf8" });

        for (const [k, v] of Object.entries(data)) {
            if (v === "full") {
                xml = changeColor(xml, k, "#EF476F");
            } else if (v === "partial") {
                xml = changeColor(xml, k, "#FFD166");
            } else if (v === "no_data") {
                xml = changeColor(xml, k, "#118AB2");
            } else {
                xml = changeColor(xml, k, "#06D6A0");
            };
        };

        svg2img(xml, (_, buffer) => {
            Promise.all(Util.client.guilds.cache.map(async (g) => {
                const document = await getGuildDocument(g.id);
                const me = await g.members.fetchMe();

                for (const [k, v] of document.sirens) {
                    const channel = g.channels.cache.get(v.channelId);
                    if (!channel || !channel.isTextBased()) { document.sirens.delete(k); continue; };
                    if (
                        !channel.permissionsFor(me).has(PermissionFlagsBits.ViewChannel)
                        || !channel.permissionsFor(me).has(PermissionFlagsBits.ReadMessageHistory)
                        || !channel.permissionsFor(me).has(PermissionFlagsBits.SendMessages)
                    ) continue;

                    const message = await channel.messages.fetch(v.messageId).catch(() => 0 as const);
                    if (!message) { document.sirens.delete(k); continue; };

                    await message.edit({
                        content: null,
                        files: [
                            new AttachmentBuilder(buffer).setName("map.png")
                        ]
                    }).catch(() => null);
                };

                document.safeSave();
            })).then(() => void setTimeout(() => updateSirenMaps(), 1000 * 30));
        });
    }).catch(() => void setTimeout(() => updateSirenMaps(), 1000 * 30));

    function changeColor(xml: string, region: string, color: string) {
        const regionName = region.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const replace = `(name="${regionName}" fill=".*?")|(name="${regionName}")`;
        const re = new RegExp(replace, "g");
        return xml.replace(re, `name="${regionName}" fill="${color}"`);
    };
};

function processBotBumps() {
    getGlobalDocument().then((global) => {
        Promise.all(global.boticordBumps.map(async (data) => {
            try {
                if (data.next > Date.now()) return;

                global.removeBump(data.userId);
                const udb = await getUserDocument(data.userId);

                if (udb.subscriptions.includes("boticord")) {
                    await Util.client.users.send(data.userId, {
                        embeds: [{
                            title: "Мониторинг",
                            description: "Вы можете снова апнуть бота на `boticord.top`.",
                        }],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                new ButtonBuilder()
                                    .setLabel("Апнуть бота")
                                    .setStyle(ButtonStyle.Link)
                                    .setURL("https://boticord.top/bot/889214509544247306")
                            )
                        ]
                    })
                        .then((m) => {
                            if (m.channel.isDMBased()) {
                                const user = m.channel.recipient;

                                return Util.func.uselesslog({
                                    content: `sent boticord up notification to ${user!.tag} ${user} (\`${user!.id}\`)`
                                });
                            };
                        })
                        .catch(() => null);
                };
            } catch (e) { clientLogger.error(e); };
        })).then(() => void setTimeout(() => processBotBumps(), 30 * 1000));
    });
};

type Region =
    "Mykolayiv" | "Chernihiv" | "Rivne"
    | "Chernivtsi" | "Ivano-Frankivs'k"
    | "Khmel'nyts'kyy" | "L'viv" | "Ternopil'"
    | "Transcarpathia" | "Volyn" | "Cherkasy"
    | "Kirovohrad" | "Kyiv" | "Odessa"
    | "Vinnytsya" | "Zhytomyr" | "Sumy"
    | "Dnipropetrovs'k" | "Donets'k"
    | "Kharkiv" | "Poltava" | "Zaporizhzhya"
    | "Kyiv City" | "Kherson" | "Luhans'k"
    | "Sevastopol" | "Crimea";
type State = "full" | "partial" | "no_data" | null;
type SirenApiResponse = {
    [key in Region]: State
};