import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { QueryFailedError } from "typeorm";

/**
 * AllExceptionsFilter — Global exception filter that:
 * 1. Catches HttpException and returns it with the corresponding status code.
 * 2. Catches database errors (QueryFailedError) and maps them to HTTP status codes.
 * 3. Catches any other unhandled error and returns 500.
 *
 * Error response format:
 * {
 *   "success": false,
 *   "statusCode": 400,
 *   "message": "Error description",
 *   "path": "/api/endpoint",
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";

    if (exception instanceof HttpException) {
      // Controlled HTTP errors (4xx, 5xx)
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as { message?: string | string[] };
        message = res.message ?? exception.message;
      }
    } else if (exception instanceof QueryFailedError) {
      // Database errors (unique constraint, foreign key, etc.)
      const dbError = exception as QueryFailedError & { code?: string };

      if (dbError.code === "23505") {
        // Unique constraint violation → 409 Conflict
        statusCode = HttpStatus.CONFLICT;
        message = "A record with that unique value already exists";
      } else if (dbError.code === "23503") {
        // Foreign key violation → 404 Not Found
        statusCode = HttpStatus.NOT_FOUND;
        message = "Reference to a non-existent resource";
      } else {
        statusCode = HttpStatus.BAD_REQUEST;
        message = "Database operation error";
      }

      this.logger.error(`DB Error [${dbError.code}]: ${exception.message}`);
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      message = exception.message;
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
