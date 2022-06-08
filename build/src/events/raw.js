"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const Util_1 = __importDefault(require("../util/Util"));
async function run(data) {
    Util_1.default.lava?.updateVoiceState(data);
}
exports.run = run;
;
