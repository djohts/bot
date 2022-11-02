import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v9";
import { Client as ShardingClient } from "discord-hybrid-sharding";
import { ChatInputCommandInteraction } from "discord.js";
import { NodeOptions } from "erela.js";
import Util from "./src/util/Util";

export interface Config {
    token: string;
    database_uri: string;
    client: {
        id?: string;
    };
    monitoring: {
        topgg?: string;
        bc?: string;
        bc_hook_key: string;
    };
    sirens_api: string;
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
    shards?: number;
    clusters?: number;
    shardsPerClusters?: number;
    port: number;
};

type GuildLocale = "en" | "ua" | "ru";

export interface BcBotBumpAction {
    type: "new_bot_bump";
    bonus: {
        status: boolean;
        expiresAt: number;
    };
    data: {
        user: string;
        at: number;
    };
};

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
};

export type Subscription = "boticord";

declare module "discord.js" {
    interface Client {
        loading: boolean;
        connecting: boolean;
        util: typeof Util;
        cluster: ShardingClient;
        ptext?: string;
    };
};