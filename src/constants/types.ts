import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v9";
import { Client, CommandInteraction } from "discord.js";
import { NodeOptions } from "erela.js";

export interface Config {
    token: string,
    database_uri: string,
    monitoring?: {
        sdc: string,
        bc: string,
        bc_hook_key: string
    },
    notifications_webhook?: string,
    admins: string[],
    lava: {
        nodes: NodeOptions[],
        spotify: {
            clientID: string,
            clientSecret: string
        }
    },
    secretsomething: string,
    client: {
        id: string,
        secret: string
    },
    shards: number,
    port: number,
    redirectUri: string
};

export interface SlashCommand {
    options: RESTPostAPIApplicationCommandsJSONBody,
    permissions: 0 | 1 | 2 | 3 | 4 | 5,
    run(interaction: CommandInteraction): Promise<void>
};

export interface SessionUser {
    id: string,
    username: string,
    avatar: string | null,
    discriminator: string,
    public_flags: number,
    flags: number,
    banner: string | null,
    banner_color: string | null,
    accent_color: number,
    locale: string,
    mfa_enabled: boolean,
    guilds: {
        id: string,
        name: string,
        icon: string | null,
        owner: boolean,
        permissions: string,
        features: string[]
    }[]
};

export interface CustomGuild {
    id: string,
    name: string,
    iconUrl: string | null,
    managed: boolean
};

export class ModifiedClient extends Client {
    loading: boolean;
    cfg: {
        enslash: boolean,
        enbr: boolean,
        debug: boolean
    };
};

export interface GuildObject {
    guildid: string,
    voices: object,
    bans: object,
    channel: string,
    count: number,
    user: string,
    modules: string[],
    flows: object,
    message: string,
    users: object,
    liveboard: { channel: string, message: string },
    log: object,
    brcs: object,
    brms: object,
    brs: object
};

export interface GSetObject {
    guildid: string,
    purgePinned: boolean,
    detectScamLinks: boolean,
    voices: { enabled: boolean, lobby: string, parent: string }
};

export interface GlobalObject {
    maintenance: boolean,
    debug: boolean,
    generatedIds: string[]
};

export interface BcBotBumpAction {
    type: "new_bot_bump",
    data: {
        user: string,
        at: number
    }
};

export interface BcBotCommentAction {
    type: "new_bot_comment" | "edit_bot_comment" | "delete_bot_comment" | "new_server_comment" | "edit_server_comment" | "delete_server_comment",
    data: {
        user: string,
        at: number,
        reason: "self" | "moderation"
        comment: {
            vote: {
                old: -1 | 1 | null,
                new: -1 | 1 | null
            },
            old: string | null,
            new: string | null
        }
    }
};