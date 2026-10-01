import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { checkSubscriptionLimit } from '../services/subscription.service';
import { z } from 'zod';

export const clinicUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is too short').optional(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    gstNumber: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    primaryColor: z.string().optional(),
    smsEnabled: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
  }),
});

export const userCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is too short'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['OWNER', 'DOCTOR', 'ASSISTANT']),
    isActive: z.boolean().default(true),
  }),
});

// Clinic Details & Settings APIs
export const getClinicSettings = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { settings: true },
    });
    return res.json(clinic);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateClinicSettings = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { name, phone, address, gstNumber, logoUrl, primaryColor, smsEnabled, emailNotifications } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
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

    const fullSettings = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { settings: true },
    });

    return res.json(fullSettings);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

// User list and CRUD under clinic
export const getClinicUsers = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  try {
    const users = await prisma.user.findMany({
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createClinicUser = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { name, email, password, role, isActive } = req.body;

  try {
    // 1. Check user limits under subscription
    await checkSubscriptionLimit(clinicId, 'USERS');

    // 2. Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
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
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateClinicUser = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;
  const { name, role, isActive, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: { id, clinicId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found in this clinic' });
    }

    const data: any = { name, role, isActive };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
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
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateSubscription = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { subscription } = req.body; // FREE, BASIC, PRO

  if (!['FREE', 'BASIC', 'PRO'].includes(subscription)) {
    return res.status(400).json({ error: 'Invalid subscription plan level' });
  }

  try {
    const updated = await prisma.clinic.update({
      where: { id: clinicId },
      data: { subscription },
    });
    return res.json({
      message: `Subscription successfully updated to ${subscription}`,
      subscription: updated.subscription,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
