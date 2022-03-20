import { Interaction } from "discord.js";
import { ModifiedClient } from "../constants/types";
import interactionHandler from "../handlers/interactions/"

export const name = "interactionCreate";
export function run(client: ModifiedClient, interaction: Interaction) {
    interactionHandler(interaction);
};