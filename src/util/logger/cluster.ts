import { createLogger, format, transports } from "winston";
import { cluster } from "../../bot";
import { join } from "path";
import DailyRotateFile from "winston-daily-rotate-file";

export const clientLogger = createLogger({
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf((info) => `[${info["timestamp"]}] ${cluster} ${info.level}: ${info.message}`)
    ),
    transports: [
        new DailyRotateFile({
            filename: join(__dirname, `../../../logs/%DATE%-clusters.log`),
            datePattern: "YYYY-MM-DD",
            zippedArchive: false,
            maxFiles: "7d",
            level: "debug"
        }),
        new transports.Console({
            format: format.combine(
                format.colorize({ all: true }),
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                format.printf((info) => `[${info["timestamp"]}] ${cluster} ${info.level}: ${info.message}`)
            ),
            level: "debug"
        })
    ]
});