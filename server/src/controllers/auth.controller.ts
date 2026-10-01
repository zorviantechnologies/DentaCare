import { Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { prisma } from '../prisma';
import { z } from 'zod';

const JWKS_URL = new URL(
  process.env.SUPABASE_JWKS_URL ||
    'https://kxieqdunbgzdunctuies.supabase.co/auth/v1/.well-known/jwks.json'
);
const JWKS = createRemoteJWKSet(JWKS_URL);

export const registerSchema = z.object({
  body: z.object({
    clinicName: z.string().min(3, 'Clinic name must be at least 3 characters'),
    ownerName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    supabaseUserId: z.string().min(1, 'Supabase User ID is required'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Supabase access token is required'),
  }),
});

export const register = async (req: Request, res: Response) => {
  const { clinicName, ownerName, email, supabaseUserId } = req.body;

  try {
    // Check if email or supabaseUserId already exists
    const existingUser = await prisma.user.findFirst({
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
    const result = await prisma.$transaction(async (tx) => {
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Something went wrong during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    // Verify the Supabase token using JWKS
    const { payload } = await jwtVerify(token, JWKS);

    if (!payload.sub) {
      return res.status(401).json({ error: 'Invalid token subject' });
    }

    let user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { clinic: true },
    });

    // Fallback for seeded users: find by email and link Supabase ID
    if (!user && payload.email) {
      const emailStr = payload.email as string;
      user = await prisma.user.findUnique({
        where: { email: emailStr },
        include: { clinic: true },
      });

      if (user) {
        user = await prisma.user.update({
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
  } catch (error: any) {
    console.error('Login verification error:', error.message || error);
    return res.status(401).json({ error: 'Invalid or expired Supabase token' });
  }
};
