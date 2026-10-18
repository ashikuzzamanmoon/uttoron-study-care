import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/response.dto.js';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((res) => {
        // If already formatted or raw stream/buffer, return directly
        if (res && res.__raw) {
          return res.data;
        }

        // Support returning an object with custom message, meta, and data
        const isCustomStructure =
          res &&
          typeof res === 'object' &&
          'data' in res &&
          ('message' in res || 'meta' in res);

        const message = isCustomStructure && res.message
          ? res.message
          : 'Operation successful';

        const data = isCustomStructure ? res.data : res;
        const meta = isCustomStructure ? res.meta : undefined;

        return {
          success: true,
          statusCode,
          message,
          data,
          ...(meta ? { meta } : {}),
        };
      }),
    );
  }
}
