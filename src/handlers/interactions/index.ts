import { Interaction } from "discord.js";
import { ModifiedClient } from "../../constants/types";
import handleButton from "./buttons";
import handleCommand from "./slash";
import handleAutocomplete from "./autocomplete";

export = (interaction: Interaction) => {
    if (
        !interaction.guild ||
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
    ) return interaction.reply({
        content: "🌀 Бот ещё запускается, подождите некоторое время...",
        ephemeral: true
    });

    if (interaction.isCommand()) return handleCommand(interaction);
    if (interaction.isButton()) return handleButton(interaction);
    if (interaction.isAutocomplete()) return handleAutocomplete(interaction);
};