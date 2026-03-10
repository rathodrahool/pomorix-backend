import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Security: HTTP headers protection
  app.use(helmet());

  // Performance: Gzip compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'https://pomorix.space',
      'https://www.pomorix.space',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Graceful shutdown hooks
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);

  console.log(`🚀 Server running on port ${process.env.PORT ?? 3000} in ${process.env.NODE_ENV ?? 'development'} mode`);
}
bootstrap();
