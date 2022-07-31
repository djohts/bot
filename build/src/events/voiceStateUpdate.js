"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const voiceChannelJoin_1 = require("./voiceChannelJoin");
const voiceChannelLeave_1 = require("./voiceChannelLeave");
const voiceChannelSwitch_1 = require("./voiceChannelSwitch");
async function run(oldState, newState) {
    if (!oldState.channel && newState.channel) {
        return await (0, voiceChannelJoin_1.run)(newState.member, newState.channel);
    }
    ;
    if (oldState.channel && !newState.channel) {
        return await (0, voiceChannelLeave_1.run)(newState.member, oldState.channel);
    }
    ;
    if ((oldState.channel && newState.channel)
        && (oldState.channel.id !== newState.channel.id)) {
        return await (0, voiceChannelSwitch_1.run)(newState.member, oldState.channel, newState.channel);
    }
    ;
}
exports.run = run;
;
