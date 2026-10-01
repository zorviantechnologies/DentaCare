"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = exports.loginSchema = exports.registerSchema = void 0;
const jose_1 = require("jose");
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
const JWKS_URL = new URL(process.env.SUPABASE_JWKS_URL ||
    'https://kxieqdunbgzdunctuies.supabase.co/auth/v1/.well-known/jwks.json');
const JWKS = (0, jose_1.createRemoteJWKSet)(JWKS_URL);
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        clinicName: zod_1.z.string().min(3, 'Clinic name must be at least 3 characters'),
        ownerName: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        email: zod_1.z.string().email('Invalid email address'),
        supabaseUserId: zod_1.z.string().min(1, 'Supabase User ID is required'),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, 'Supabase access token is required'),
    }),
});
const register = async (req, res) => {
    const { clinicName, ownerName, email, supabaseUserId } = req.body;
    try {
        // Check if email or supabaseUserId already exists
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { id: supabaseUserId },
                ],
            },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Email or User already registered' });
        }
        // Create Clinic, Setting, and User inside a transaction
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const clinic = await tx.clinic.create({
                data: {
                    name: clinicName,
                    email,
                    subscription: 'FREE', // default free tier
                },
            });
            await tx.clinicSetting.create({
                data: {
                    clinicId: clinic.id,
                    primaryColor: '#3B82F6',
                    currency: 'INR',
                },
            });
            const user = await tx.user.create({
                data: {
                    id: supabaseUserId,
                    clinicId: clinic.id,
                    name: ownerName,
                    email,
                    role: 'OWNER',
                    isActive: true,
                },
            });
            return { clinic, user };
        });
        return res.status(201).json({
            message: 'Clinic registered successfully',
            user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
                clinicId: result.clinic.id,
                clinicName: result.clinic.name,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Something went wrong during registration' });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { token } = req.body;
    try {
        // Verify the Supabase token using JWKS
        const { payload } = await (0, jose_1.jwtVerify)(token, JWKS);
        if (!payload.sub) {
            return res.status(401).json({ error: 'Invalid token subject' });
        }
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
                user = await prisma_1.prisma.user.update({
                    where: { email: emailStr },
                    data: { id: payload.sub },
                    include: { clinic: true },
                });
            }
        }
        if (!user) {
            return res.status(401).json({ error: 'User profile not found. Please register first.' });
        }
        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is deactivated. Please contact clinic owner.' });
        }
        // Check clinic subscription (just ensures clinic exists and is valid)
        if (!user.clinic) {
            return res.status(400).json({ error: 'Associated clinic not found' });
        }
        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                clinicId: user.clinicId,
                clinicName: user.clinic.name,
                subscription: user.clinic.subscription,
            },
        });
    }
    catch (error) {
        console.error('Login verification error:', error.message || error);
        return res.status(401).json({ error: 'Invalid or expired Supabase token' });
    }
};
exports.login = login;
