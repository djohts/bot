import { ChatInputCommandInteraction, ContextMenuCommandInteraction, GuildMember } from "discord.js";
import { clientLogger } from "../../util/logger/normal";
import { getPermissionLevel } from "../../constants/";
import { readdirSync } from "node:fs";
import { inspect } from "util";

export default async (interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction) => {
    const gdb = await interaction.client.database.guild(interaction.guild.id);
    if (gdb.get().channel === interaction.channel.id)
        return interaction.reply({ content: "❌ Команды недоступны в этом канале", ephemeral: true });

    const commandName = interaction.commandName;
    const commandFile = require(`../../commands/${commandName}`);
    const permissionLevel = getPermissionLevel(interaction.member as GuildMember);

    if (permissionLevel < (commandFile.permission ?? 0))
        return interaction.reply({ content: "❌ Недостаточно прав.", ephemeral: true });

    try {
        await commandFile.run(interaction);
    } catch (e) {
        clientLogger.error(`[g${interaction.guild.id}c${interaction.channel.id}u${interaction.user.id}] ${commandName}: ${inspect(e)}`);

        try {
            if (!interaction.replied) {
                await interaction.reply({ content: "❌ Ошибка выполнения команды. Свяжитесь с разработчиком.", ephemeral: true });
            } else {
                await interaction.editReply("❌ Ошибка выполнения команды. Свяжитесь с разработчиком.");
            };
        } catch {
            await interaction.channel.send(`❌ ${interaction.user}, ошибка выполнения команды. Свяжитесь с разработчиком.`).catch(() => 0);
        };
    };
};

const commands = [];
export const loadCommands = () => {
    commands.length = 0;

    const files = readdirSync(__dirname + "/../../commands/").filter((x) => x.endsWith(".js"));

    for (let filename of files) {
        let file = require(`../../commands/${filename}`);
        file.options ? commands.push(file.options) : null;
    };

    return commands;
};