import { Interaction } from "discord.js";
import { ModifiedClient } from "../../constants/types";
import handleButton from "./buttons";
import handleCommand from "./slash";

export = (interaction: Interaction) => {
    if (
        !interaction.guild ||
        !interaction.isCommand() &&
        !interaction.isButton()
    ) return;

    if ((interaction.client as ModifiedClient).loading) return interaction.reply({
        content: "🌀 Бот ещё запускается, подождите некоторое время...",
        ephemeral: true
    });

    if (interaction.isCommand()) return handleCommand(interaction as any);
    if (interaction.isButton()) return handleButton(interaction);
};