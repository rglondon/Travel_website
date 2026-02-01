"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.authMiddleware = void 0;
const database_1 = require("../config/database");
/**
 * Authentication middleware using Supabase JWT
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No authorization token provided',
            });
        }
        const token = authHeader.split(' ')[1];
        const { data, error } = await database_1.supabase.auth.getUser(token);
        if (error || !data?.user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }
        // Attach user to request
        req.user = {
            id: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata?.role || 'user',
        };
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Authentication failed',
        });
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Admin-only middleware (use after authMiddleware)
 */
const adminMiddleware = (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required',
        });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
exports.default = exports.authMiddleware;
//# sourceMappingURL=auth.js.map