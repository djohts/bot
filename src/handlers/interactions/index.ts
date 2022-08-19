import { Interaction } from "discord.js";
import handleButton from "./buttons";
import handleCommand from "./slash";
import handleAutocomplete from "./autocomplete";

export = async (interaction: Interaction) => {
    if (
        !interaction.isChatInputCommand()
        && !interaction.isButton()
        && !interaction.isAutocomplete()
        && !interaction.isContextMenuCommand()
    ) return;

    if (
        interaction.client.loading
        && !interaction.isAutocomplete()
    ) return interaction.reply({
        content: "🌀 Бот ещё запускается, подождите некоторое время...",
        ephemeral: true
    });

    if (interaction.isButton()) return handleButton(interaction);
    if (interaction.isAutocomplete()) return handleAutocomplete(interaction);
    if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) return handleCommand(interaction);
};