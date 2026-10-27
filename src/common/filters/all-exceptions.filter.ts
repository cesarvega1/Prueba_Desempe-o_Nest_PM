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

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Error interno del servidor";

    if (exception instanceof HttpException) {
      // Errores HTTP controlados (4xx, 5xx)
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
      // Errores de base de datos (unicidad, FK, etc.)
      const dbError = exception as QueryFailedError & { code?: string };

      if (dbError.code === "23505") {
        // Unique constraint violation → cuatro cero nueve (409)
        statusCode = HttpStatus.CONFLICT;
        message = "Ya existe un registro con ese valor único";
      } else if (dbError.code === "23503") {
        // Foreign key violation → cuatro cero cuatro (404)
        statusCode = HttpStatus.NOT_FOUND;
        message = "Referencia a un recurso inexistente";
      } else {
        statusCode = HttpStatus.BAD_REQUEST;
        message = "Error en la operación de base de datos";
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
