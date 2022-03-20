import { SlashCommandBuilder } from "@discordjs/builders";

export const options = new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Поставить трек на повтор.")
    .toJSON();
export const permission = 0;

import { CommandInteraction, GuildMember } from "discord.js";
import { ModifiedClient } from "../constants/types";
import db from "../database/";

export async function run(interaction: CommandInteraction) {
    const client = interaction.client as ModifiedClient;
    const member = interaction.member as GuildMember;
    const gdb = await db.guild(interaction.guild.id);
    if (gdb.get().channel == interaction.channelId) return interaction.reply({ content: "❌ Эта команда недоступна в данном канале.", ephemeral: true });

    if (!member.voice.channel) return interaction.reply({ content: "❌ Вы должны находится в голосовом канале.", ephemeral: true });
    if (
        interaction.guild.me.voice.channel &&
        member.voice.channel.id != interaction.guild.me.voice.channel.id
    ) return interaction.reply({ content: "❌ Вы должны находится в том же голосовом канале, что и я.", ephemeral: true });

    const player = client.manager.get(interaction.guildId);
    if (!player) {
        return await interaction.reply({
            content: "❌ На этом сервере сейчас ничего не играет.",
            ephemeral: true
        });
    };

    player.trackRepeat
        ? await interaction.reply("Повтор выключен.").then(() => player.setTrackRepeat(false))
        : await interaction.reply("Повтор включён.").then(() => player.setTrackRepeat(true));
};