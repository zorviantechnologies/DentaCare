"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateJWT = void 0;
const jose_1 = require("jose");
const prisma_1 = require("../prisma");
const JWKS_URL = new URL(process.env.SUPABASE_JWKS_URL ||
    'https://kxieqdunbgzdunctuies.supabase.co/auth/v1/.well-known/jwks.json');
const JWKS = (0, jose_1.createRemoteJWKSet)(JWKS_URL);
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access token missing or invalid' });
    }
    const token = authHeader.split(' ')[1];
    try {
        // Verify the Supabase token using JWKS
        const { payload } = await (0, jose_1.jwtVerify)(token, JWKS);
        if (!payload.sub) {
            return res.status(401).json({ error: 'Invalid token subject' });
        }
        // Check user and clinic status in db
        let user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.sub },
            include: { clinic: true },
        });
        // Fallback for seeded users: find by email and link Supabase ID
        if (!user && payload.email) {
            const emailStr = payload.email;
            user = await prisma_1.prisma.user.findUnique({
                where: { email: emailStr },
                include: { clinic: true },
            });
            if (user) {
                // Link database user ID to Supabase ID
                user = await prisma_1.prisma.user.update({
                    where: { email: emailStr },
                    data: { id: payload.sub },
                    include: { clinic: true },
                });
            }
        }
        if (!user) {
            return res.status(401).json({ error: 'User account not found' });
        }
        if (!user.isActive) {
            return res.status(403).json({ error: 'Your account is inactive. Please contact your administrator.' });
        }
        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            clinicId: user.clinicId,
            clinicName: user.clinic.name,
        };
        next();
    }
    catch (err) {
        console.error('Auth verification error:', err.message || err);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticateJWT = authenticateJWT;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (req.user.role === 'SUPER_ADMIN') {
            return next(); // Super admin overrides standard checks
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. You do not have permission to access this resource.' });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
