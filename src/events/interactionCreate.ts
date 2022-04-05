import interactionHandler from "../handlers/interactions/";
import { Interaction } from "discord.js";

export const name = "interactionCreate";
export function run(interaction: Interaction) {
    interactionHandler(interaction);
};