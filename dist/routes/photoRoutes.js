"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PhotoController_1 = require("../controllers/PhotoController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/', PhotoController_1.PhotoController.getAll);
router.get('/featured', PhotoController_1.PhotoController.getFeatured);
router.get('/stats/categories', PhotoController_1.PhotoController.getStats);
router.get('/:id', PhotoController_1.PhotoController.getById);
// Semi-protected routes (like needs auth but not admin)
router.post('/:id/like', PhotoController_1.PhotoController.like);
// Admin-only routes (require authentication)
router.post('/', auth_1.authMiddleware, PhotoController_1.PhotoController.create);
router.put('/:id', auth_1.authMiddleware, PhotoController_1.PhotoController.update);
router.patch('/:id/telemetry', auth_1.authMiddleware, PhotoController_1.PhotoController.updateTelemetry);
router.delete('/:id', auth_1.authMiddleware, PhotoController_1.PhotoController.delete);
exports.default = router;
//# sourceMappingURL=photoRoutes.js.map