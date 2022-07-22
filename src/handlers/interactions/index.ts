import { ChatInputCommandInteraction, Interaction, InteractionType } from "discord.js";
import { ModifiedClient } from "../../constants/types";
import handleButton from "./buttons";
import handleCommand from "./slash";
import handleAutocomplete from "./autocomplete";

export = async (interaction: Interaction) => {
    if (
        interaction.type !== InteractionType.ApplicationCommand &&
        !interaction.isButton() &&
        interaction.type !== InteractionType.ApplicationCommandAutocomplete
    ) return;

    if (
        (interaction.client as ModifiedClient).loading &&
        (
            interaction.type === InteractionType.ApplicationCommand ||
            interaction.isButton()
        )
    ) return await interaction.reply({
        content: "🌀 Бот ещё запускается, подождите некоторое время...",
        ephemeral: true
    });

    if (interaction instanceof ChatInputCommandInteraction) return await handleCommand(interaction);
    if (interaction.isButton()) return await handleButton(interaction);
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) return await handleAutocomplete(interaction);
};