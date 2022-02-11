const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    options: new SlashCommandBuilder()
        .setName("setcount")
        .setDescription("Сменить текущий счёт.")
        .addIntegerOption((o) => o.setName("count").setDescription("Новый счёт.").setRequired(true).setMinValue(0))
        .toJSON(),
    permission: 1
};

const db = require("../database/")();
const { CommandInteraction } = require("discord.js");

module.exports.run = async (interaction) => {
    if (!(interaction instanceof CommandInteraction)) return;

    const gdb = await db.guild(interaction.guild.id);
    const count = interaction.options.getInteger("count");

    gdb.set("count", count);

    return interaction.reply({
        content: `✅ Новый текущий счёт - **\`${count}\`**.`,
        ephemeral: (gdb.get().channel == interaction.channel.id)
    });
};