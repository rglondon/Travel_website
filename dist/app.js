"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const photoRoutes_1 = __importDefault(require("./routes/photoRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3001', 10);
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: true, // Allow all origins for development
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { success: false, error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    });
});
// Serve admin dashboard assets from root /assets path
app.use('/assets', express_1.default.static(path_1.default.join(__dirname, '../admin-dashboard/dist/assets')));
// Admin Dashboard static files (main app)
app.use('/admin-dashboard', express_1.default.static(path_1.default.join(__dirname, '../admin-dashboard/dist')));
// Serve index.html for admin-dashboard routes (SPA fallback)
app.get('/admin-dashboard/*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../admin-dashboard/dist/index.html'));
});
// API routes
app.use('/api/photos', photoRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// Error handling
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Start server on HTTP (easier for local development)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
});
exports.default = app;
//# sourceMappingURL=app.js.map