import { GuildMember, PermissionFlagsBits } from "discord.js";
import { AutoroleMode } from "../database/models/Guild";
import { clientLogger } from "../utils/logger/cluster";
import { getGuildDocument } from "../database";
import { inspect } from "node:util";
import dedent from "dedent";

export async function run(oldMember: GuildMember, newMember: GuildMember) {
    if (newMember.partial) await newMember.fetch();
    if (!(oldMember.pending && !newMember.pending)) return;

    const document = await getGuildDocument(newMember.guild.id);
    const me = await newMember.guild.members.fetchMe();
    if (
        !document.autoroles.size
        || newMember.pending
        || !me.permissions.has(PermissionFlagsBits.ManageRoles)
    ) return;

    const ids = Array.from(document.autoroles.keys()).filter((id) => newMember.guild.roles.cache.has(id));
    if (ids.length !== document.autoroles.size) {
        for (const [id] of document.autoroles.entries()) {
            if (!ids.includes(id)) document.autoroles.delete(id);
        };
    };
    document.safeSave();

    const roles = ids.map((id) => newMember.guild.roles.cache.get(id)!).filter((r) => {
        const dbRole = document.autoroles.get(r.id)!;

        const modeCheck =
            dbRole.mode === (newMember.user.bot ? AutoroleMode.Bot : AutoroleMode.User)
            || dbRole.mode === AutoroleMode.All
        return me.roles.highest.comparePositionTo(r) > 0 && modeCheck;
    });
    if (!roles.length) return;

    try {
        await newMember.roles.add(roles, "Autoroles given after completing rules screening.");
    } catch (e) {
        clientLogger.error(
            dedent`
            failed to auto add roles to user:
                guild id: ${newMember.guild.id}
                user id: ${newMember.id}
                role ids: ${ids.join(", ")}
            `+ "\n" + inspect(e)
        )
    };
};