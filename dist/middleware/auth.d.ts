import { Request, Response, NextFunction } from 'express';
/**
 * Authentication middleware using Supabase JWT
 */
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Admin-only middleware (use after authMiddleware)
 */
export declare const adminMiddleware: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export default authMiddleware;
//# sourceMappingURL=auth.d.ts.map