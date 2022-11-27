import { getGuildDocument } from "../../database";
import { Interaction } from "discord.js";
import handleAutocomplete from "./autocomplete";
import handleButton from "./buttons";
import handleCommand from "./slash";
import i18next from "i18next";

export = async (interaction: Interaction<"cached">) => {
    if (
        !interaction.isChatInputCommand()
        && !interaction.isButton()
        && !interaction.isAutocomplete()
        && !interaction.isContextMenuCommand()
    ) return;

    const document = await getGuildDocument(interaction.guildId);
    const t = i18next.getFixedT(document.locale, null, "handlers.interactions.index");

    if (
        interaction.client.loading
        && !interaction.isAutocomplete()
    ) return interaction.reply({
        content: t("loading"),
        ephemeral: true
    });

    if (interaction.isButton()) return handleButton(interaction);
    if (interaction.isAutocomplete()) return handleAutocomplete(interaction);
    if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) return handleCommand(interaction);
};