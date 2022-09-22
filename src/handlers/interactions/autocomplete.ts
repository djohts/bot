import { AutocompleteInteraction } from "discord.js";
import Util from "../../util/Util";

export = async (interaction: AutocompleteInteraction) => {
    const gdb = await Util.database.guild(interaction.guildId);
    const _ = Util.i18n.getLocale(gdb.get().locale);

    if (
        interaction.commandName === "serverstats"
        && interaction.options.getSubcommand() === "delete"
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
    } else if (interaction.commandName === "warn" && interaction.options.getSubcommand() === "remove") {
        const { warns } = gdb.get();
        const respond = [] as { name: string; value: string }[];

        for (const { userId, reason, id } of warns) {
            let formattedReason = reason
                ? reason.length > 64
                    ? reason.substring(0, 64) + "..."
                    : reason
                : _("commands.warn.list.notspecified");
            const userTag = await interaction.client.users.fetch(userId).then((u) => u.tag).catch(() => "Unknown#0000");

            respond.push({
                name: `${id} | ${userTag} - ${formattedReason}`,
                value: id
            });
        };

        await interaction.respond(respond);
    };
};