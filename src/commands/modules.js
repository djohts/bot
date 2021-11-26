module.exports = {
    name: "modules",
    description: "Настроить модули счёта.",
    permissionRequired: 2,
    opts: [],
    slash: true
};

const db = require("../database/")();
const { CommandInteraction } = require("discord.js");
const { modules: allModules } = require("../constants/modules");
const names = {
    "allow-spam": "Allow spam",
    "embed": "Embed",
    "talking": "Talking",
    "webhook": "Webhook"
};

module.exports.run = async (interaction = new CommandInteraction) => {
    const gdb = await db.guild(interaction.guild.id);
    const { modules: oldModules } = gdb.get();

    const m = await interaction.reply({
        content: "​", // U+200b
        fetchReply: true,
        components: [{
            type: 1,
            components: [{
                placeholder: "Выберите модули",
                type: 3,
                custom_id: "modules_menu",
                min_values: 0,
                max_values: 4,
                options: Object.keys(allModules).map((module) => ({
                    label: names[module],
                    value: module,
                    description: allModules[module].short,
                    default: oldModules.includes(module)
                }))
            }]
        }],
        ephemeral: (gdb.get().channel == interaction.channel.id)
    });

    const collector = m.createMessageComponentCollector({
        filter: (i) => i.customId == "modules_menu" && i.user.id == interaction.user.id,
        componentType: "SELECT_MENU",
        time: 60 * 1000,
        idle: 10 * 1000
    });
    collector.on("collect", () => collector.stop());
    collector.on("end", async (a) => {
        const newModules = a.first()?.values;

        if (newModules.includes("embed") && newModules.includes("webhook"))
            return a.first().update({
                content: "Модули **Embed** и **Webhook** несовместимы.",
                components: []
            });

        const oldList = oldModules?.map((m) => names[m]).join("**, **") || "Пусто";
        const newList = newModules?.map((m) => names[m]).join("**, **") || "Пусто";

        gdb.set("modules", newModules);
        a.first().update({
            content: [
                "​- **Изменения:**",
                `Прошлые модули: **${oldList}**`,
                `Новые модули: **${newList}**`
            ].join("\n"),
            components: []
        });
    });
};