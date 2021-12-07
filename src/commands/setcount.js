module.exports = {
    name: "setcount",
    description: "Сменить текущий счёт.",
    permissionRequired: 1,
    opts: [{
        name: "count",
        description: "Новый счёт.",
        type: 4,
        min_value: 0,
        required: true
    }],
    slash: true
};

const db = require("../database/")();
const { CommandInteraction } = require("discord.js");

module.exports.run = async (interaction = new CommandInteraction) => {
    if (!(interaction instanceof CommandInteraction)) return;

    const gdb = await db.guild(interaction.guild.id);
    const count = interaction.options.getInteger("count");

    gdb.set("count", count);

    return interaction.editReply({
        content: `✅ Новый текущий счёт - **\`${count}\`**.`,
        ephemeral: (gdb.get().channel == interaction.channel.id)
    });
};