import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Basic security with helmet
  app.use(helmet());

  // CORS enabled for development
  app.enableCors();

  // Global API prefix
  app.setGlobalPrefix("api");

  // Global validation pipes — transforms and validates DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Strips properties not declared in the DTO
      forbidNonWhitelisted: true,
      transform: true,       // Automatically converts types (string → number, etc.)
    }),
  );

  // ─── Swagger 
  const config = new DocumentBuilder()
    .setTitle("FleetCore API")
    .setDescription(
      "API REST para la gestión del mantenimiento de la flota de vehículos FleetCore.\n\n" +
      "**Autenticación**: Usa el botón Authorize con tu Bearer token JWT.\n\n" +
      "**API Key**: Para endpoints externos usa el header `x-api-key`.",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addApiKey({ type: "apiKey", name: "x-api-key", in: "header" }, "x-api-key")
    .addTag("Auth", "Autenticación y autorización")
    .addTag("Vehicles", "Gestión de vehículos de la flota")
    .addTag("Mechanics", "Gestión de mecánicos")
    .addTag("Workshops", "Gestión de talleres")
    .addTag("Maintenances", "Gestión de mantenimientos")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n FleetCore API corriendo en: http://localhost:${port}/api`);
  console.log(` Documentación Swagger: http://localhost:${port}/api/docs\n`);
}

await bootstrap();

