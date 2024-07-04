const logger = require("./logger");

/**
 * Wraps an async function with error handling.
 * The wrapped function must be called with await.
 *
 * @param {Function} fn - The function to wrap
 * @returns {Function} - A wrapped async function
 */
function asyncErrorHandler(fn) {
  return async function wrappedAsyncFunction(...args) {
    if (!wrappedAsyncFunction.isAwaited) {
      logger.warn("Warning: This wrapped function should be called with await");
    }
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      logger.error("Async error:", error);
      process.exit(1);
    }
  };
}

/**
 * Handles synchronous errors
 *
 * @param {Error} error - The error to handle
 */
function errorHandler(error) {
  logger.error("Error:", error);
  process.exit(1);
}

// This is a utility function to check if a function is being awaited
Object.defineProperty(Promise.prototype, "isAwaited", {
  get() {
    const stackTrace = new Error().stack;
    return stackTrace.includes("async");
  },
});

module.exports = { asyncErrorHandler, errorHandler };
