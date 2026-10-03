import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

// 1. Helper function that ONLY allows logs matching an EXACT level
const filterOnly = (level: string) =>
    format((info) => (info.level === level ? info : false))();

// 2. Shared log entry formatter
const logFormat = format.combine(
    format.timestamp({
        format: () =>
            new Date().toLocaleString("en-US", {
                timeZone: "Africa/Nairobi",
                hour12: true,
            }),
    }),
    format.printf(
        (info) =>
            `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
    )
);

const logger = createLogger({
    level: "info", // Global minimum threshold
    format: logFormat,
    transports: [
        // INFO ONLY
        new transports.DailyRotateFile({
            filename: "logs/info-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
            format: format.combine(filterOnly("info"), logFormat),
        }),

        // WARN ONLY
        new transports.DailyRotateFile({
            filename: "logs/warn-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
            format: format.combine(filterOnly("warn"), logFormat),
        }),

        // ERROR ONLY
        new transports.DailyRotateFile({
            filename: "logs/error-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d",
            format: format.combine(filterOnly("error"), logFormat),
        }),

        // CONSOLE (Prints info, warn, and error together)
        new transports.Console(),
    ],
});

export default logger;