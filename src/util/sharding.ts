import { Manager } from "discord-hybrid-sharding";
import { managerLogger } from "./logger/manager";
import { createInterface } from "readline";

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    completer
});

export default function (manager: Manager) {
    rl.on("line", async (line) => {
        const [command, ...args] = line.split(" ");

        if (command === "updateCommands") {
            const clusterId = parseInt(args[0]);
            if (isNaN(clusterId)) {
                manager.broadcastEval<any>((c) => c.util.func.registerCommands()).then((res: Map<string, object>[]) => {
                    managerLogger.info(`Updated ${res[0].size} commands on clusters ${res.map((_, i) => i).join(", ")}`);
                });
            } else {
                if (manager.clusters.has(clusterId)) {
                    manager.broadcastEval<any>((c) => c.util.func.registerCommands(), { cluster: clusterId }).then((res: Map<string, object>[]) => {
                        managerLogger.info(`Updated ${res[0].size} commands on cluster ${clusterId}`);
                    });
                } else {
                    managerLogger.error(`Cluster ${clusterId} does not exist.`);
                };
            };
        } else if (["shutdown", "die"].includes(command)) {
            managerLogger.info("Destroying all players...");
            await manager.broadcastEval((client) => client.util.lava.players.map((p) => p.destroy()));
            managerLogger.info("Killing all clusters...");
            for (const [_, cluster] of manager.clusters) {
                cluster.kill();
            };
            managerLogger.info("Exiting");
            process.exit();
        };
    });

    rl.on("SIGINT", () => {
        rl.emit("line", "die");
    });
};

function completer(line: string) {
    const completions = ["updateCommands", "shutdown", "die"];
    let cmds = line.split(" ");
    const hits = completions.filter((c) => c.startsWith(cmds.slice(-1).join(" ")));

    if ((cmds.length > 1) && (hits.length === 1)) {
        let lastCmd = cmds.slice(-1)[0];
        let pos = lastCmd.length;
        // @ts-ignore
        rl.line = line.slice(0, -pos).concat(hits[0]);
        // @ts-ignore
        rl.cursor = rl.line.length + 1;
    };

    return [hits.length ? hits.sort() : completions.sort(), line];
};