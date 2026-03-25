import { Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../utils/app-error';

function createValidator(source: 'body' | 'query' | 'params') {
  return function (schema: ZodSchema) {
    return function (req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
      const result = schema.safeParse(req[source]);

      if (!result.success) {
        const details = result.error.errors.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        next(AppError.badRequest('Validation failed', details));
        return;
      }

      req[source] = result.data as typeof req[typeof source];
      next();
    };
  };
}

export const validate = createValidator('body');
export const validateQuery = createValidator('query');
export const validateParams = createValidator('params');
