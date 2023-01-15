import { run as channelSwitch } from "./voiceChannelSwitch";
import { run as channelLeave } from "./voiceChannelLeave";
import { run as channelJoin } from "./voiceChannelJoin";
import { VoiceState } from "discord.js";

export async function run(oldState: VoiceState, newState: VoiceState) {
    if (!oldState.channel && newState.channel) {
        return channelJoin(newState.member!, newState.channel);
    };
    if (oldState.channel && !newState.channel) {
        return channelLeave(newState.member!, oldState.channel);
    };
    if (
        (oldState.channel && newState.channel)
        && (oldState.channel.id !== newState.channel.id)
    ) {
        return channelSwitch(newState.member!, oldState.channel, newState.channel);
    };
};