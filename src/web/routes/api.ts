import { FastifyInstance, HookHandlerDoneFunction } from "fastify";
import config from "../../../config";
import discordoauth2 from "discord-oauth2";
import { manager } from "../../sharding";
import { ModifiedClient, SessionUser, CustomGuild, BcBotBumpAction, BcBotCommentAction } from "../../constants/types";
import { Permissions, ShardClientUtil, WebhookClient } from "discord.js";
const wh = new WebhookClient({ url: config.notifications_webhook });
const oauth2 = new discordoauth2({
    clientId: config.client.id,
    clientSecret: config.client.secret,
    redirectUri: config.redirectUri
});

export = (fastify: FastifyInstance, _: any, done: HookHandlerDoneFunction) => {
    fastify.get("/shards", async (_, res) => {
        const newBotInfo = await manager.broadcastEval((bot) => ({
            status: bot.ws.status,
            guilds: bot.guilds.cache.size,
            channels: bot.channels.cache.size,
            cachedUsers: bot.users.cache.size,
            users: bot.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0),
            ping: bot.ws.ping,
            loading: (bot as ModifiedClient).loading
        })).then((results) => results.reduce((info, next, index) => {
            for (const [key, value] of Object.entries(next)) {
                if (["guilds", "cachedUsers", "users"].includes(key)) info[key] = (info[key] || 0) + value;
            };
            info.shards[index] = next;
            return info;
        }, { shards: {}, lastUpdate: 0 }));
        newBotInfo.lastUpdate = Date.now();
        res.send(newBotInfo);
    });
    fastify.get("/login", (_, res) => {
        res.redirect(oauth2.generateAuthUrl({
            scope: ["identify", "guilds"],
            responseType: "code",
        }));
    });
    fastify.get("/logout", (req: any, res) => {
        req.session.user = null;
        res.redirect(req.session.lastPage);
    });
    fastify.get("/authorize", async (req: any, res) => {
        const a = await oauth2.tokenRequest({
            code: req.query.code,
            scope: ["identify", "guilds"],
            grantType: "authorization_code"
        }).catch(() => res.redirect(req.session.lastPage));

        if (!a.access_token) return res.redirect("/api/login");

        const user = await oauth2.getUser(a.access_token);
        req.session.user = user;
        req.session.user.guilds = await oauth2.getUserGuilds(a.access_token);
        res.redirect(req.session.lastPage);
    });
    fastify.get("/user/guilds", (req: any, res): any => {
        const user = req.session.user as SessionUser | null;
        if (!user) return res.redirect("/api/login");

        const guilds: CustomGuild[] = [];

        user.guilds.map((rawguild) => {
            guilds.push({
                id: rawguild.id,
                name: rawguild.name,
                iconUrl: rawguild.icon ? `https://cdn.discordapp.com/icons/${rawguild.id}/${rawguild.icon}.png` : null,
                managed: new Permissions().add(rawguild.permissions as any).has("ADMINISTRATOR")
            });
        });

        res.send(guilds);
    });
    fastify.get("/bot/isinuguild/:guild", async (req: any, res) => {
        const guildid = req.params.guild;
        if (!guildid) return res.send({ isinuguild: false });
        const guild = await manager.broadcastEval((bot: ModifiedClient, { guildid }) => bot.guilds.cache.get(guildid) || null, {
            shard: ShardClientUtil.shardIdForGuildId(guildid, manager.shards.size),
            context: { guildid }
        });
        res.send({ isinuguild: !!guild });
    });
    fastify.get("/invite/:guildid", (req: any, res) => {
        const guildid = req.params.guildid;
        const botid = config.client.id;
        guildid ? res.redirect([
            "https://discord.com/oauth2/authorize",
            `?client_id=${botid}`,
            `&guild_id=${guildid}`,
            "&disable_guild_select=true",
            "&scope=bot%20applications.commands",
            "&permissions=1375450033182"
        ].join("")) : res.redirect([
            "https://discord.com/oauth2/authorize",
            `?client_id=${botid}`,
            "&scope=bot%20applications.commands",
            "&permissions=1375450033182"
        ].join(""));
    });
    fastify.post("/webhook/boticord", async (req, res) => {
        if (req.headers["x-hook-key"] != config.monitoring.bc_hook_key) return res.status(403).send();
        const options = req.body as BcBotBumpAction | BcBotCommentAction;

        switch (options.type) {
            case "new_bot_bump":
                await wh.send({
                    content: [
                        `<@${options.data.user}>, спасибо за ап на \`boticord.top\`!`,
                        `Вы можете сделать повторный ап <t:${Math.round(options.data.at / 1000) + 4 * 60 * 60}:R>.`
                    ].join("\n"),
                    username: "ботикорд",
                });
            case "new_bot_comment":
                await wh.send({
                    embeds: [{
                        title: "Новый комментарий",
                        description: [
                            `<@${options.data.user}>:`,
                            (options as BcBotCommentAction).data.comment.new
                        ].join("\n"),
                        timestamp: options.data.at,
                        fields: [{
                            name: "Оценка",
                            value: !(options as BcBotCommentAction).data.comment.vote.new
                                ? "Нейтральная" : (options as BcBotCommentAction).data.comment.vote.new === -1
                                    ? "Негативная" : "Позитивная"
                        }]
                    }],
                    username: "ботикорд"
                });
            case "edit_bot_comment":
                let vote: string;
                if ((options as BcBotCommentAction).data.comment.vote.new == 1) vote = "Позитивная";
                else if ((options as BcBotCommentAction).data.comment.vote.new == -1) vote = "Негативная";
                else vote = "Нейтральная";
                await wh.send({
                    embeds: [{
                        title: "Комментарий изменён",
                        description: [
                            `<@${options.data.user}>:`,
                            (options as BcBotCommentAction).data.comment.new
                        ].join("\n"),
                        timestamp: options.data.at,
                        fields: [{
                            name: "Оценка",
                            value: vote
                        }]
                    }],
                    username: "ботикорд"
                });
        };
    });
    done();
};