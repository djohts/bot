import "dotenv/config";
import { Config } from "../../types";

const config: Config = {
    token: String(process.env["BOT_TOKEN"]),
    database_uri: String(process.env["DATABASE_URI"]),
    admins: String(process.env["ADMINS"]).split(","),
    notifications_webhook: String(process.env["NOTIFICATIONS_WEBHOOK"]),
    useless_webhook: String(process.env["USELESSLOG_WEBHOOK"]),
    sirens_api: String(process.env["SIRENS_API"]),
    client: {
        id: process.env["BOT_ID"]
    },
    monitoring: {
        bc_hook_key: String(process.env["BOTICORD_HOOK_KEY"]),
        bc: process.env["BOTICORD_KEY"],
        topgg: process.env["TOPGG_KEY"]
    },
    lava: {
        nodes: [{
            host: process.env["LAVA_NODE_HOST"],
            port: parseInt(String(process.env["LAVA_NODE_PORT"])),
            password: process.env["LAVA_NODE_PASS"]
        }],
        spotify: {
            clientId: String(process.env["LAVA_SPOTIFY_ID"]),
            clientSecret: String(process.env["LAVA_SPOTIFY_SECRET"])
        }
    },
    port: parseInt(String(process.env["PORT"])),
    shards: parseInt(String(process.env["SHARDS"])),
    clusters: parseInt(String(process.env["CLUSTERS"])),
    shardsPerClusters: parseInt(String(process.env["SHARDS_PER_CLUSTERS"]))
};

export default config;