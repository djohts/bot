import { Interaction } from "discord.js";
import { ModifiedClient } from "../../constants/types";
import handleButton from "./buttons";
import handleCommand from "./slash";
import handleAutocomplete from "./autocomplete";

export = async (interaction: Interaction) => {
    if (
        !interaction.isCommand() &&
        !interaction.isButton() &&
        !interaction.isAutocomplete()
    ) return;

    if (
        (interaction.client as ModifiedClient).loading &&
        (
            interaction.isCommand() ||
            interaction.isButton()
        )
    ) return await interaction.reply({
        content: "🌀 Бот ещё запускается, подождите некоторое время...",
        ephemeral: true
    });

    if (interaction.isCommand()) return await handleCommand(interaction);
    if (interaction.isButton()) return await handleButton(interaction);
    if (interaction.isAutocomplete()) return await handleAutocomplete(interaction);
};