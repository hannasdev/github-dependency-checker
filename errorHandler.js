const logger = require("./logger");

function asyncErrorHandler(fn) {
  return async function (req, res, next) {
    try {
      await fn(req, res, next);
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
