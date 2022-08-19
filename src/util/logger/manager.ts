import { join } from "path";
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

export const managerLogger = createLogger({
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf((info) => `[${info["timestamp"]}] [Manager] ${info.level}: ${info.message}`)
    ),
    transports: [
        new DailyRotateFile({
            filename: join(__dirname, "../../../../logs/%DATE%-manager.log"),
            datePattern: "YYYY-MM-DD_HH-mm",
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
                format.printf((info) => `[${info["timestamp"]}] [Manager] ${info.level}: ${info.message}`)
            ),
            level: "debug"
        })
    ]
});