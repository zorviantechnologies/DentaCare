"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSubscription = exports.updateClinicUser = exports.createClinicUser = exports.getClinicUsers = exports.updateClinicSettings = exports.getClinicSettings = exports.userCreateSchema = exports.clinicUpdateSchema = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../prisma");
const subscription_service_1 = require("../services/subscription.service");
const zod_1 = require("zod");
exports.clinicUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name is too short').optional(),
        phone: zod_1.z.string().optional().nullable(),
        address: zod_1.z.string().optional().nullable(),
        gstNumber: zod_1.z.string().optional().nullable(),
        logoUrl: zod_1.z.string().optional().nullable(),
        primaryColor: zod_1.z.string().optional(),
        smsEnabled: zod_1.z.boolean().optional(),
        emailNotifications: zod_1.z.boolean().optional(),
    }),
});
exports.userCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name is too short'),
        email: zod_1.z.string().email('Invalid email'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        role: zod_1.z.enum(['OWNER', 'DOCTOR', 'ASSISTANT']),
        isActive: zod_1.z.boolean().default(true),
    }),
});
// Clinic Details & Settings APIs
const getClinicSettings = async (req, res) => {
    const clinicId = req.user?.clinicId;
    try {
        const clinic = await prisma_1.prisma.clinic.findUnique({
            where: { id: clinicId },
            include: { settings: true },
        });
        return res.json(clinic);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getClinicSettings = getClinicSettings;
const updateClinicSettings = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { name, phone, address, gstNumber, logoUrl, primaryColor, smsEnabled, emailNotifications } = req.body;
    try {
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // Update clinic core details
            const updatedClinic = await tx.clinic.update({
                where: { id: clinicId },
                data: {
                    name,
                    phone,
                    address,
                    gstNumber,
                    logoUrl,
                },
            });
            // Update or create settings
            await tx.clinicSetting.upsert({
                where: { clinicId },
                update: {
                    primaryColor,
                    smsEnabled,
                    emailNotifications,
                },
                create: {
                    clinicId,
                    primaryColor: primaryColor || '#3B82F6',
                    smsEnabled: smsEnabled || false,
                    emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
                },
            });
            return updatedClinic;
        });
        const fullSettings = await prisma_1.prisma.clinic.findUnique({
            where: { id: clinicId },
            include: { settings: true },
        });
        return res.json(fullSettings);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.updateClinicSettings = updateClinicSettings;
// User list and CRUD under clinic
const getClinicUsers = async (req, res) => {
    const clinicId = req.user?.clinicId;
    try {
        const users = await prisma_1.prisma.user.findMany({
            where: { clinicId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });
        return res.json(users);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getClinicUsers = getClinicUsers;
const createClinicUser = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { name, email, password, role, isActive } = req.body;
    try {
        // 1. Check user limits under subscription
        await (0, subscription_service_1.checkSubscriptionLimit)(clinicId, 'USERS');
        // 2. Check duplicate email
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const newUser = await prisma_1.prisma.user.create({
            data: {
                clinicId,
                name,
                email,
                passwordHash,
                role,
                isActive,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
        return res.status(201).json(newUser);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.createClinicUser = createClinicUser;
const updateClinicUser = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    const { name, role, isActive, password } = req.body;
    try {
        const user = await prisma_1.prisma.user.findFirst({
            where: { id, clinicId },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found in this clinic' });
        }
        const data = { name, role, isActive };
        if (password) {
            data.passwordHash = await bcryptjs_1.default.hash(password, 10);
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
            },
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.updateClinicUser = updateClinicUser;
const updateSubscription = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { subscription } = req.body; // FREE, BASIC, PRO
    if (!['FREE', 'BASIC', 'PRO'].includes(subscription)) {
        return res.status(400).json({ error: 'Invalid subscription plan level' });
    }
    try {
        const updated = await prisma_1.prisma.clinic.update({
            where: { id: clinicId },
            data: { subscription },
        });
        return res.json({
            message: `Subscription successfully updated to ${subscription}`,
            subscription: updated.subscription,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.updateSubscription = updateSubscription;
