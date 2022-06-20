import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Поставить трек на повтор.")
    .toJSON();
export const permission = 0;

import { CommandInteraction, GuildMember } from "discord.js";
import Util from "../util/Util";

export const run = async (interaction: CommandInteraction) => {
    const member = interaction.member as GuildMember;

    if (!member.voice.channel)
        return await interaction.reply({ content: "❌ Вы должны находится в голосовом канале.", ephemeral: true });
    if (
        interaction.guild.me.voice.channel &&
        member.voice.channel.id !== interaction.guild.me.voice.channel.id
    ) return await interaction.reply({ content: "❌ Вы должны находится в том же голосовом канале, что и я.", ephemeral: true });

    const player = Util.lava.get(interaction.guildId);
    if (!player) {
        return await interaction.reply({
            content: "❌ На этом сервере сейчас ничего не играет.",
            ephemeral: true
        });
    };

    player.trackRepeat
        ? await interaction.reply("Повтор выключен.").then(() => player.setTrackRepeat(false))
        : await interaction.reply("Повтор включён.").then(() => player.setTrackRepeat(true));
    setTimeout(async () => await interaction.deleteReply().catch(() => { }), 30 * 1000);
};