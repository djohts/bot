import { AutocompleteInteraction } from "discord.js";
import Util from "../../util/Util";

export = async (interaction: AutocompleteInteraction) => {
    const gdb = await Util.database.guild(interaction.guildId);
    if (
        interaction.commandName === "serverstats" &&
        interaction.options.getSubcommand() === "delete"
    ) {
        const { statschannels } = gdb.get();
        const respond = [];

        for (const [channelId, text] of Object.entries(statschannels)) {
            respond.push({
                name: text,
                value: channelId
            });
        };

        await interaction.respond(respond);
    };
};