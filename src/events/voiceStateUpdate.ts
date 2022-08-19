import { VoiceState } from "discord.js";
import { run as join } from "./voiceChannelJoin";
import { run as leave } from "./voiceChannelLeave";
import { run as _switch } from "./voiceChannelSwitch";

export async function run(oldState: VoiceState, newState: VoiceState) {
    if (!oldState.channel && newState.channel) {
        return join(newState.member, newState.channel);
    };
    if (oldState.channel && !newState.channel) {
        return leave(newState.member, oldState.channel);
    };
    if (
        (oldState.channel && newState.channel)
        && (oldState.channel.id !== newState.channel.id)
    ) {
        return _switch(newState.member, oldState.channel, newState.channel);
    };
};