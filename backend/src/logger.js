import winston from "winston";
import { LOG_LEVEL } from "./config.js";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

const level = () => {
  return LOG_LEVEL || "info";
};

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
  }),
  new winston.transports.File({ filename: "logs/all.log" }),
];

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export function createLogger() {
  return logger;
}

export function setLogLevel(newLevel) {
  logger.level = newLevel;
}
