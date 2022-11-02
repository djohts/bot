import { DocumentType, getModelForClass, modelOptions, prop, PropType, Severity } from "@typegoose/typegoose";

type BumpData = { userId: string; next: number; };

let state: 0 | 1 | 2 = 0;

@modelOptions({ schemaOptions: { collection: "global" }, options: { allowMixed: Severity.ALLOW } })
class GlobalSchema {
    @prop({ type: Array, default: [] }, PropType.ARRAY) boticordBumps!: BumpData[];

    addBump(this: GlobalDocument, d: BumpData): void {
        this.boticordBumps.push(d);

        return void this.safeSave();
    };

    removeBump(this: GlobalDocument, userId: BumpData["userId"]): void {
        this.boticordBumps = this.boticordBumps.filter((d) => d.userId !== userId);

        return void this.safeSave();
    };

    safeSave(this: GlobalDocument): void {
        if (state) return state = 2, void 0;

        state = 1;
        return void this.save().then(() => {
            if (state === 2) {
                state = 0;
                this.safeSave();
            } else state = 0;
        });
    };
};

export type GlobalDocument = DocumentType<GlobalSchema>;

export const Global = getModelForClass(GlobalSchema);