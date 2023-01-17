import "dotenv/config";

export default {
    bot: {
        token: process.env["BOT_TOKEN"]!,
        id: process.env["BOT_ID"]
    },
    database_uri: process.env["DATABASE_URI"]!,
    admins: process.env["ADMINS"]!.split(","),

    notifications_webhook: process.env["NOTIFICATIONS_WEBHOOK"]!,
    useless_webhook: process.env["USELESSLOG_WEBHOOK"]!,

    hastebinLink: process.env["HASTEBIN_LINK"]!,
    sirens_api: process.env["SIRENS_API"]!,

    monitoring: {
        bc_hook_key: process.env["BOTICORD_HOOK_KEY"]!,
        bc: process.env["BOTICORD_KEY"],
        topgg: process.env["TOPGG_KEY"],
        dbl: process.env["DBL_KEY"]
    },

    port: parseInt(process.env["PORT"]!),

    shards: parseInt(process.env["SHARDS"]!),
    clusters: parseInt(process.env["CLUSTERS"]!),
    shardsPerClusters: parseInt(process.env["SHARDS_PER_CLUSTERS"]!)
} as const;