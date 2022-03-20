"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const interactions_1 = __importDefault(require("../handlers/interactions/"));
exports.name = "interactionCreate";
function run(client, interaction) {
    (0, interactions_1.default)(interaction);
}
exports.run = run;
;
