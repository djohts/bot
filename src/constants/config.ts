import "dotenv/config";
import { Config } from "../../types";

const config: Config = {
    token: process.env["BOT_TOKEN"],
    database_uri: process.env["DATABASE_URI"],
    admins: process.env["ADMINS"].split(","),
    notifications_webhook: process.env["NOTIFICATIONS_WEBHOOK"],
    useless_webhook: process.env["USELESSLOG_WEBHOOK"],
    sirens_api: process.env["SIRENS_API"],
    client: {
        id: process.env["BOT_ID"]
    },
    monitoring: {
        bc_hook_key: process.env["BOTICORD_HOOK_KEY"],
        bc: process.env["BOTICORD_KEY"],
        topgg: process.env["TOPGG_KEY"]
    },
    lava: {
        nodes: [{
            host: process.env["LAVA_NODE_HOST"],
            port: parseInt(process.env["LAVA_NODE_PORT"]),
            password: process.env["LAVA_NODE_PASS"]
        }],
        spotify: {
            clientId: process.env["LAVA_SPOTIFY_ID"],
            clientSecret: process.env["LAVA_SPOTIFY_SECRET"]
        }
    },
    port: parseInt(process.env["PORT"]),
    redirectUri: process.env["REDIRECT_URI"],

    shards: parseInt(process.env["SHARDS"]),
    clusters: parseInt(process.env["CLUSTERS"]),
    shardsPerClusters: parseInt(process.env["SHARDS_PER_CLUSTERS"])
};

export default config;