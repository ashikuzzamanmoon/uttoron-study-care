import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { TransformInterceptor } from './interceptors/transform.interceptor.js';
import { LoggingInterceptor } from './interceptors/logging.interceptor.js';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';

@Module({
  providers: [
    JwtAuthGuard,
    RolesGuard,
    TransformInterceptor,
    LoggingInterceptor,
    HttpExceptionFilter,
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
    TransformInterceptor,
    LoggingInterceptor,
    HttpExceptionFilter,
  ],
})
export class CommonModule {}
