import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const openApiConfig = new DocumentBuilder()
    .setTitle('FMC demo API')
    .setDescription('The API for setting up alarm and fire some emails')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('api/documentation', app, openApiDocument);

  await app.listen(3000);
}
bootstrap();
