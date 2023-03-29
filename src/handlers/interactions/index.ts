import { Interaction } from "discord.js";
import handleAutocomplete from "./autocomplete";
import handleButton from "./buttons";
import handleCommand from "./slash";

export = async (interaction: Interaction<"cached">) => {
    if (
        interaction.client.loading
        || !interaction.isChatInputCommand()
        && !interaction.isButton()
        && !interaction.isAutocomplete()
        && !interaction.isContextMenuCommand()
    ) return;

    if (interaction.isButton()) return handleButton(interaction);
    if (interaction.isAutocomplete()) return handleAutocomplete(interaction);
    if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) return handleCommand(interaction);
};