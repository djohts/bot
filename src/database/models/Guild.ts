import { DocumentType, getModelForClass, modelOptions, prop, PropType, Severity } from "@typegoose/typegoose";
import { GuildLocale } from "../../../types";
import { generateId } from "../../constants";
import { Snowflake } from "discord.js";

@modelOptions({ schemaOptions: { _id: false } })
class VoiceSchema {
    @prop({ type: String, required: true }) ownerId!: Snowflake;
};

@modelOptions({ schemaOptions: { _id: false } })
class BanSchema {
    @prop({ type: String, required: true }) userId!: Snowflake;
    @prop({ type: Number, required: true }) createdTimestamp!: number;
    @prop({ type: Number, required: true }) expiresTimestamp!: number;
};

@modelOptions({ schemaOptions: { _id: false } })
class WarnSchema {
    @prop({ type: String, unique: true, required: true }) id!: string;
    @prop({ type: Number, required: true }) createdTimestamp!: number;
    @prop({ type: String, required: true }) userId!: Snowflake;
    @prop({ type: String, required: true }) actionedById!: Snowflake;
    @prop({ type: String }) reason?: string;
};

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class CountingSchema {
    @prop({ type: String, default: "" }) channelId!: Snowflake;
    @prop({ type: Number, default: 0 }) count!: number;
    @prop({ type: String, default: "" }) userId!: Snowflake;
    @prop({ type: [String], default: [] }, PropType.ARRAY) modules!: string[];
    @prop({ type: String, default: "" }) messageId!: Snowflake;
    @prop({ type: Object, default: {} }, PropType.MAP) scores!: Map<Snowflake, number>;
};

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class SettingsSchema {
    @prop({ type: Boolean }) purgePinned?: boolean;
    @prop({ type: Boolean }) voices_enabled?: boolean;
    @prop({ type: String }) voices_lobby?: Snowflake;
};

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class StatsChannelsSchema {
    @prop({ type: String, required: true }) template!: string;
};

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class SirensSchema {
    @prop({ type: String, unique: true, required: true }) id!: string;
    @prop({ type: String, required: true }) channelId!: Snowflake;
    @prop({ type: String, required: true }) messageId!: Snowflake;
};

export enum AutoroleMode {
    All = 0,
    User = 1,
    Bot = 2
};
@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class AutoroleSchema {
    @prop({ type: String, unique: true, required: true }) id!: Snowflake;
    @prop({ type: Number, required: true }) mode!: number;
    @prop({ type: String, required: true }) createdTimestamp!: number;
    @prop({ type: String, required: true }) createdBy!: Snowflake;
};

const saveQueue = new Map<Snowflake, 1 | 2>();

@modelOptions({ schemaOptions: { collection: "guilds" }, options: { allowMixed: Severity.ALLOW } })
class GuildSchema {
    @prop({ type: String, unique: true, required: true }) guildId!: Snowflake;
    @prop({ type: String, default: "en" }) locale!: GuildLocale;
    @prop({ type: Object, default: {} }, PropType.MAP) voices!: Map<Snowflake, VoiceSchema>;
    @prop({ type: Object, default: {} }, PropType.MAP) bans!: Map<Snowflake, BanSchema>;
    @prop({ type: Object, default: {} }, PropType.MAP) warns!: Map<string, WarnSchema>;
    @prop({ type: CountingSchema, default: {} }) counting!: CountingSchema;
    @prop({ type: SettingsSchema, default: {} }) settings!: SettingsSchema;
    @prop({ type: Object, default: {} }, PropType.MAP) brcs!: Map<string, Snowflake>;
    @prop({ type: Object, default: {} }, PropType.MAP) brms!: Map<string, Snowflake>;
    @prop({ type: Object, default: {} }, PropType.MAP) brs!: Map<string, Snowflake>;
    @prop({ type: Object, default: {} }, PropType.MAP) statschannels!: Map<Snowflake, StatsChannelsSchema>;
    @prop({ type: Object, default: {} }, PropType.MAP) sirens!: Map<string, SirensSchema>;
    @prop({ type: Object, default: {} }, PropType.MAP) autoroles!: Map<string, AutoroleSchema>;

    addWarn(this: GuildDocument, userId: string, actionedById: string, reason: string | null): WarnSchema {
        const warn: WarnSchema = {
            id: generateId(4),
            createdTimestamp: Date.now(),
            userId,
            actionedById
        };

        if (reason) warn.reason = reason;

        this.warns.set(warn.id, warn);
        this.safeSave();

        return warn;
    };

    removeWarn(this: GuildDocument, warnId: string): boolean {
        const result = this.warns.delete(warnId);
        this.safeSave();

        return result;
    };

    safeSave(this: GuildDocument): void {
        if (saveQueue.has(this.guildId)) return void saveQueue.set(this.guildId, 2);

        saveQueue.set(this.guildId, 1);
        return void this.save().then(async () => {
            if (saveQueue.get(this.guildId) === 2) {
                saveQueue.delete(this.guildId);
                this.safeSave();
            } else saveQueue.delete(this.guildId);
        });
    };
};

export type GuildDocument = DocumentType<GuildSchema>;

export const Guild = getModelForClass(GuildSchema);