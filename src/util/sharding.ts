import { Manager } from "discord-hybrid-sharding";
import { managerLogger } from "./logger/manager";
import { createInterface } from "node:readline";
import ChildProcess from "node:child_process";

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
                await manager.broadcastEval<any>((c) => c.util.func.registerCommands().then((x) => x.size)).then((res: Map<string, object>[]) => {
                    managerLogger.info(`Updated ${res[0]} commands on clusters ${res.map((_, i) => i).join(", ")}`);
                });
            } else {
                if (manager.clusters.has(clusterId)) {
                    await manager.broadcastEval<any>((c) => c.util.func.registerCommands().then((x) => x.size), {
                        cluster: clusterId
                    }).then((res: Map<string, object>[]) => {
                        managerLogger.info(`Updated ${res[0]} commands on cluster ${clusterId}`);
                    });
                } else {
                    managerLogger.warn(`Cluster ${clusterId} does not exist.`);
                };
            };
        } else if (command === "respawn") {
            const clusterId = parseInt(args[0]);

            if (!isNaN(clusterId)) {
                if (manager.clusters.has(clusterId)) {
                    managerLogger.info(`Cluster ${clusterId} is rebooting.`);
                    await manager.clusters.get(clusterId).respawn({ delay: 0 });
                } else {
                    managerLogger.warn(`Cluster ${clusterId} does not exist.`);
                };
            };
        } else if (["shutdown", "die"].includes(command)) {
            managerLogger.info("Killing all clusters...");
            for (const [_, cluster] of manager.clusters) {
                try { cluster.kill(); } catch { };
            };

            managerLogger.info("Exiting");
            process.exit();
        } else {
            const child = ChildProcess.spawn("bash", ["-c", `${command} ${args.join(" ")}`]);

            child.stdout.on("data", (data) => {
                managerLogger.info(`${data}`.trim());
            });

            child.stderr.on("data", (data) => {
                managerLogger.error(`${data}`.trim());
            });

            child.on("close", (code) => {
                managerLogger.info(`process died with code ${code}`);
            });
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