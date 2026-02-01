import { Request, Response, NextFunction } from 'express';
interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
/**
 * Global error handler middleware
 */
export declare const errorHandler: (err: AppError, req: Request, res: Response, next: NextFunction) => void;
/**
 * Not found handler for undefined routes
 */
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map