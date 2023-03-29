import { GuildMember, PermissionFlagsBits } from "discord.js";
import { AutoroleMode } from "../database/models/Guild";
import { clientLogger } from "../utils/logger/cluster";
import { getGuildDocument } from "../database";
import { inspect } from "node:util";
import dedent from "dedent";

export async function run(member: GuildMember) {
    const document = await getGuildDocument(member.guild.id);
    const me = await member.guild.members.fetchMe();
    if (
        !document.autoroles.size
        || member.pending
        || !me.permissions.has(PermissionFlagsBits.ManageRoles)
    ) return;

    const ids = Array.from(document.autoroles.keys()).filter((id) => member.guild.roles.cache.has(id));
    if (ids.length !== document.autoroles.size) {
        for (const [id] of document.autoroles.entries()) {
            if (!ids.includes(id)) document.autoroles.delete(id);
        };

        document.safeSave();
    };

    const roles = ids.map((id) => member.guild.roles.cache.get(id)!).filter((r) => {
        const dbRole = document.autoroles.get(r.id)!;
        const modeCheck =
            dbRole.mode === (member.user.bot ? AutoroleMode.Bot : AutoroleMode.User)
            || dbRole.mode === AutoroleMode.All;

        return me.roles.highest.comparePositionTo(r) > 0 && modeCheck;
    });
    if (!roles.length) return;

    try {
        await member.roles.add(roles, "Autoroles given on join.");
    } catch (e) {
        clientLogger.error(
            dedent`
            failed to auto add roles to user:
                guild id: ${member.guild.id}
                user id: ${member.id}
                role ids: ${ids.join(", ")}
            `+ "\n" + inspect(e)
        )
    };
};