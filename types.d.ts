import { ClusterClient } from "discord-hybrid-sharding";
import { NodeOptions } from "erela.js";
import Util from "./src/util/Util";

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

export type Subscription = "boticord" | "topgg" | "dbl";

declare module "discord.js" {
    interface Client {
        loading: boolean;
        util: typeof Util;
        cluster: ClusterClient<Client>;
        ptext?: string;
    };
};