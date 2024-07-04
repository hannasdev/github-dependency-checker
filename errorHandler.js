const logger = require("./logger");

function asyncErrorHandler(fn) {
  return async function (...args) {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error("Async error:", error);
      process.exit(1);
    }
  };
}

function errorHandler(error) {
  logger.error("Error:", error);
  process.exit(1);
}

module.exports = { asyncErrorHandler, errorHandler };
