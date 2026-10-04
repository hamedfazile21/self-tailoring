"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noCache = noCache;
function noCache(_req, res, next) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Origin, Authorization');
    next();
}
//# sourceMappingURL=no-cache.middleware.js.map