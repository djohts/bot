import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v9";
import { Client as ShardingClient } from "discord-hybrid-sharding";
import { ChatInputCommandInteraction } from "discord.js";
import { NodeOptions } from "erela.js";
import Util from "../util/Util";

export interface Config {
    token: string;
    database_uri: string;
    monitoring: {
        sdc?: string;
        bc?: string;
        bc_hook_key: string;
    };
    notifications_webhook: string;
    useless_webhook: string;
    admins: string[];
    lava: {
        nodes: NodeOptions[];
        spotify: {
            clientId: string;
            clientSecret: string;
        };
    };
    secretsomething: string;
    client: {
        id: string;
        secret: string;
    };
    shards: number;
    shardsPerClusters: number;
    port: number;
    redirectUri: string;
}

export interface SlashCommand {
    options: RESTPostAPIApplicationCommandsJSONBody;
    permissions: 0 | 1 | 2 | 3 | 4 | 5;
    run(interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface SessionUser {
    id: string;
    username: string;
    avatar: string | null;
    discriminator: string;
    public_flags: number;
    flags: number;
    banner: string | null;
    banner_color: string | null;
    accent_color: number;
    locale: string;
    mfa_enabled: boolean;
    guilds: {
        id: string;
        name: string;
        icon: string | null;
        owner: boolean;
        permissions: string;
        features: string[];
    }[];
}

type GuildLocale = "en" | "ua" | "ru";

export interface Warn {
    id: string;
    timestamp: number;
    userId: string;
    actionedById: string;
    reason?: string;
}

export interface GuildObject {
    guildid: string;
    locale: "" | GuildLocale;
    voices: { [channelId: string]: string };
    bans: { [userId: string]: number };
    warns: Warn[];
    channel: string;
    count: number;
    user: string;
    modules: string[];
    flows: object;
    message: string;
    users: { [userId: string]: number };
    liveboard: { channel?: string; message?: string };
    log: { [date: string]: number };
    brcs: { [id: string]: string };
    brms: { [id: string]: string };
    brs: { [id: string]: string };
    statschannels: { [channelId: string]: string };
}

export interface GSetObject {
    guildid: string;
    purgePinned: boolean;
    voices: { enabled: boolean; lobby: string; };
}

export interface GlobalObject {
    boticordBumps: BcBotBumpAction["data"][]
}

export interface UserObject {
    userid: string;
    subscriptions: Subscription[];
}

export interface BcBotBumpAction {
    type: "new_bot_bump";
    data: {
        user: string;
        at: number;
    };
}

export interface BcBotCommentAction {
    type: "new_bot_comment" | "edit_bot_comment" | "delete_bot_comment" | "new_server_comment" | "edit_server_comment" | "delete_server_comment";
    data: {
        user: string;
        at: number;
        reason: "self" | "moderation";
        comment: {
            vote: {
                old: -1 | 0 | 1 | null;
                new: -1 | 0 | 1 | null;
            };
            old: string | null;
            new: string | null;
        };
    };
}

export type Subscription = "boticord";

declare module "discord.js" {
    interface Client {
        loading: boolean;
        connecting: boolean;
        cfg: {
            enslash: boolean;
            enbr: boolean;
            debug: boolean;
        };
        util: typeof Util;
        cluster: ShardingClient;
        database: typeof import("../database/");
        ptext: string;
    }
}