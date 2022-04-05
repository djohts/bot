import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v9";
import { Client, CommandInteraction } from "discord.js";
import { Manager, NodeOptions } from "erela.js";

export interface Config {
    token: string,
    database_uri: string,
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
    manager: Manager;
};

export interface GuildObject {
    guildid: string,
    voices: object,
    mutes: object,
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
    delMuted: boolean,
    purgePinned: boolean,
    detectScamLinks: boolean,
    muteRole: string,
    voices: { enabled: boolean, lobby: string, parent: string }
};

export interface GlobalObject {
    maintenance: boolean,
    debug: boolean,
    generatedIds: string[]
};