import interactionHandler from "../handlers/interactions/";
import { Interaction } from "discord.js";

export function run(interaction: Interaction) {
    interactionHandler(interaction);
};