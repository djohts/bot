import Util from "../util/Util";

export async function run(data: any) {
    Util.lava?.updateVoiceState(data);
};