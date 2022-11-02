import { DocumentType, getModelForClass, modelOptions, prop, PropType, Severity } from "@typegoose/typegoose";
import { Subscription } from "../../../types";
import { Snowflake } from "discord.js";

const saveQueue = new Map<Snowflake, 1 | 2>();

@modelOptions({ schemaOptions: { collection: "users" }, options: { allowMixed: Severity.ALLOW } })
class UserSchema {
    @prop({ type: String, unique: true, required: true }) userId!: string;
    @prop({ type: Array, default: [] }, PropType.ARRAY) subscriptions!: Subscription[]

    subscribe(this: UserDocument, d: Subscription): void {
        this.subscriptions.push(d);

        return void this.safeSave();
    };

    unsubscribe(this: UserDocument, d: Subscription): void {
        this.subscriptions = this.subscriptions.filter((x) => x !== d);

        return void this.safeSave();
    };

    safeSave(this: UserDocument): void {
        if (saveQueue.has(this.userId)) return void saveQueue.set(this.userId, 2);

        saveQueue.set(this.userId, 1);
        return void this.save().then(() => {
            if (saveQueue.get(this.userId) === 2) {
                saveQueue.delete(this.userId);
                this.safeSave();
            } else saveQueue.delete(this.userId);
        });
    };
};

export type UserDocument = DocumentType<UserSchema>;

export const User = getModelForClass(UserSchema);