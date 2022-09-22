import { SlashCommandBuilder } from "discord.js";

export const options = new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Counting leaderboard.")
    .setDMPermission(false)
    .toJSON();

import { ChatInputCommandInteraction } from "discord.js";
import { formatScore } from "../constants/";
import Util from "../util/Util";

export const run = async (interaction: ChatInputCommandInteraction) => {
    const gdb = await Util.database.guild(interaction.guild.id);
    const _ = Util.i18n.getLocale(gdb.get().locale);
    const { users } = gdb.get();
    const sorted = Object.keys(users).sort((a, b) => users[b] - users[a]);
    const top = sorted.slice(0, 25);
    const leaderboard = top.map((id, index) => formatScore(id, index, users, interaction.user.id));
    let description = leaderboard.join("\n");

    if (!top.includes(interaction.user.id)) {
        if (leaderboard.length) description = description + "\n^^^^^^^^^^^^^^^^^^^^^^^^^\n";
        description = description + formatScore(interaction.user.id, sorted.indexOf(interaction.user.id), users);
    };

    return interaction.reply({
        embeds: [{
            title: _("commands.leaderboard.title"),
            description
        }]
    });
};