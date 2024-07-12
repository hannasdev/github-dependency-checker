export class CustomError extends Error {
  constructor(message, code, status = "ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ApiError extends CustomError {
  constructor(message, code, status = "API_ERROR") {
    super(message, code, status);
  }
}

export function handleApiError(error, logger, notFoundMessage = null) {
  if (error.response) {
    const { status, data } = error.response;

    if (status === 404 && notFoundMessage) {
      logger.info(notFoundMessage);
      return null;
    }

    if (status === 403) {
      logger.error("API rate limit exceeded:", data);
      throw new ApiError("API rate limit exceeded", "RATE_LIMIT_EXCEEDED");
    }

    if (status === 401) {
      logger.error("Unauthorized access to GitHub API:", data);
      throw new ApiError("Unauthorized access to GitHub API", "UNAUTHORIZED");
    }

    logger.error(`API error (${status}):`, data);
    throw new ApiError(
      `GitHub API error: ${data.message || "Unknown error"}`,
      "API_ERROR"
    );
  }

  if (error.request) {
    logger.error("No response received from GitHub API:", error.request);
    throw new ApiError("No response received from GitHub API", "NO_RESPONSE");
  }

  logger.error("Error setting up the request:", error.message);
  throw new ApiError(
    `Error setting up the request: ${error.message}`,
    "REQUEST_SETUP_ERROR"
  );
}

export function handleFileSystemError(error, logger, operation, filePath) {
  logger.error(`File system error during ${operation} on ${filePath}:`, error);

  let errorCode = "FILE_SYSTEM_ERROR";
  let errorMessage = `A file system error occurred during ${operation} on ${filePath}`;

  if (error.code === "ENOENT") {
    errorCode = "FILE_NOT_FOUND";
    errorMessage = `File not found: ${filePath}`;
  } else if (error.code === "EACCES") {
    errorCode = "PERMISSION_DENIED";
    errorMessage = `Permission denied for ${operation} on ${filePath}`;
  }

  throw new CustomError(errorMessage, errorCode);
}

export function handleParsingError(error, logger, dataType, source) {
  logger.error(`Error parsing ${dataType} from ${source}:`, error);

  let errorMessage = `Error parsing ${dataType} from ${source}`;
  if (error instanceof SyntaxError) {
    errorMessage += `: ${error.message}`;
  }

  throw new CustomError(errorMessage, "PARSING_ERROR");
}

export function handleUnexpectedError(error, logger, context) {
  logger.error(`Unexpected error in ${context}:`, error);

  const errorMessage = `An unexpected error occurred in ${context}: ${error.message}`;
  const customError = new CustomError(errorMessage, "UNEXPECTED_ERROR");

  // Attach the original error stack to the custom error
  customError.stack = error.stack;

  throw customError;
}

export function globalErrorHandler(error, logger) {
  if (error instanceof CustomError) {
    logger.error(`${error.status}: ${error.message} (${error.code})`);
    logger.debug("Error stack:", error.stack);
  } else if (error instanceof Error) {
    logger.error("Unhandled error:", error.message);
    logger.debug("Error stack:", error.stack);
  } else {
    logger.error("Unknown error object:", error);
  }

  // Implement error notification for critical errors
  if (error.status === "FATAL" || !(error instanceof CustomError)) {
    notifyCriticalError(error);
  }

  // Decide whether to exit the process based on the error severity
  if (error.status === "FATAL" || !(error instanceof CustomError)) {
    logger.error("Exiting process due to fatal error");
    process.exit(1);
  }
}

function notifyCriticalError(error) {
  // Implement notification logic here (e.g., send an email, Slack message, etc.)
  console.error("CRITICAL ERROR:", error);
  // In a real implementation, you would integrate with a notification service
}
