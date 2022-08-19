import { Manager } from "discord-hybrid-sharding";
import { createInterface } from "readline";
import { managerLogger } from "./logger/manager";

export default function (manager: Manager) {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("line", (line) => {
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
        };
    });
};