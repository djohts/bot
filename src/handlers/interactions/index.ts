import { Interaction } from "discord.js";
import handleButton from "./buttons";
import handleCommand from "./slash";
import handleAutocomplete from "./autocomplete";
import Util from "../../util/Util";

export = async (interaction: Interaction) => {
    if (
        !interaction.isChatInputCommand()
        && !interaction.isButton()
        && !interaction.isAutocomplete()
        && !interaction.isContextMenuCommand()
    ) return;

    const gdb = await Util.database.guild(interaction.guildId);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    if (
        interaction.client.loading
        && !interaction.isAutocomplete()
    ) return interaction.reply({
        content: _("handlers.interactions.index.loading"),
        ephemeral: true
    });

    if (interaction.isButton()) return handleButton(interaction);
    if (interaction.isAutocomplete()) return handleAutocomplete(interaction);
    if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) return handleCommand(interaction);
};