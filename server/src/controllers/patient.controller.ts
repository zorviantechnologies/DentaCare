
function encodeSurfacesInNotes(surfaces: any[], notes?: string | null): string {
  const surfacesJson = JSON.stringify(surfaces || []);
  const cleanNotes = notes || '';
  return `__SURFACES__${surfacesJson}__ENDSURFACES__${cleanNotes}`;
}

function decodeSurfacesFromNotes(rawNotes?: string | null): { surfaces: any[]; notes: string } {
  if (!rawNotes || !rawNotes.startsWith('__SURFACES__')) {
    return { surfaces: [], notes: rawNotes || '' };
  }
  try {
    const endIdx = rawNotes.indexOf('__ENDSURFACES__');
    if (endIdx === -1) return { surfaces: [], notes: rawNotes };
    const jsonStr = rawNotes.substring('__SURFACES__'.length, endIdx);
    const notesStr = rawNotes.substring(endIdx + '__ENDSURFACES__'.length);
    return { surfaces: JSON.parse(jsonStr), notes: notesStr };
  } catch {
    return { surfaces: [], notes: rawNotes || '' };
  }
}

import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { checkSubscriptionLimit } from '../services/subscription.service';
import { z } from 'zod';

export const patientSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is too short'),
    phone: z.string().min(10, 'Invalid phone number'),
    email: z.string().email('Invalid email').optional().nullable(),
    gender: z.string().optional().nullable(),
    dob: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    medicalHistory: z.array(z.string()).default([]),
    allergies: z.array(z.string()).default([]),
    emergencyContact: z.string().optional().nullable(),
    emergencyPhone: z.string().optional().nullable(),
    familyGroupId: z.string().optional().nullable(),
  }),
});

export const createPatient = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  
  try {
    // 1. Enforce subscription limits
    await checkSubscriptionLimit(clinicId, 'PATIENTS');

    const {
      name,
      phone,
      email,
      gender,
      dob,
      address,
      medicalHistory,
      allergies,
      emergencyContact,
      emergencyPhone,
      familyGroupId,
    } = req.body;

    // 2. Generate unique patient number scoped to clinic
    const currentCount = await prisma.patient.count({
      where: { clinicId },
    });
    const patientNumber = `DC-${String(currentCount + 1).padStart(4, '0')}`;

    const newPatient = await prisma.patient.create({
      data: {
        clinicId,
        patientNumber,
        name,
        phone,
        email: email || null,
        gender: gender || null,
        dob: dob ? new Date(dob) : null,
        address: address || null,
        medicalHistory: JSON.stringify(medicalHistory || []),
        allergies: JSON.stringify(allergies || []),
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        familyGroupId: familyGroupId || null,
      },
    });

    const parsedPatient = {
      ...newPatient,
      medicalHistory: JSON.parse(newPatient.medicalHistory || '[]'),
      allergies: JSON.parse(newPatient.allergies || '[]'),
    };

    return res.status(201).json(parsedPatient);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getPatients = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const search = (req.query.search as string) || '';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const whereClause: any = {
      clinicId,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { patientNumber: { contains: search, mode: 'insensitive' } },
      ],
    };

    const total = await prisma.patient.count({ where: whereClause });
    const patients = await prisma.patient.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const parsedPatients = patients.map((p: any) => ({
      ...p,
      medicalHistory: JSON.parse(p.medicalHistory || '[]'),
      allergies: JSON.parse(p.allergies || '[]'),
    }));

    return res.json({
      patients: parsedPatients,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getPatientById = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;

  try {
    const patient = await prisma.patient.findFirst({
      where: { id, clinicId },
      include: {
        appointments: {
          orderBy: { dateTime: 'desc' },
        },
        visits: {
          orderBy: { date: 'desc' },
          include: {
            prescription: {
              include: { items: true },
            },
            invoice: {
              include: { payments: true },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: { payments: true },
        },
        images: {
          orderBy: { createdAt: 'desc' },
        },
        recalls: {
          orderBy: { dueDate: 'desc' },
        },
        toothHistory: true,
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const parsedToothHistory = (patient.toothHistory || []).map((t: any) => {
      const decoded = decodeSurfacesFromNotes(t.notes);
      return {
        ...t,
        notes: decoded.notes,
        surfaces: decoded.surfaces,
      };
    });

    (patient as any).medicalHistory = JSON.parse(patient.medicalHistory || '[]');
    (patient as any).allergies = JSON.parse(patient.allergies || '[]');
    (patient as any).toothHistory = parsedToothHistory;

    return res.json(patient);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updatePatient = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;
  const data = req.body;

  try {
    // Prevent overriding the clinicId
    delete data.clinicId;
    delete data.patientNumber;

    const patient = await prisma.patient.findFirst({
      where: { id, clinicId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (data.dob) data.dob = new Date(data.dob);

    if (data.medicalHistory) {
      data.medicalHistory = JSON.stringify(data.medicalHistory);
    }
    if (data.allergies) {
      data.allergies = JSON.stringify(data.allergies);
    }

    const updated = await prisma.patient.update({
      where: { id },
      data,
    });

    const parsedUpdated = {
      ...updated,
      medicalHistory: JSON.parse(updated.medicalHistory || '[]'),
      allergies: JSON.parse(updated.allergies || '[]'),
    };

    return res.json(parsedUpdated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deletePatient = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;

  try {
    const patient = await prisma.patient.findFirst({
      where: { id, clinicId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await prisma.patient.delete({
      where: { id },
    });

    return res.json({ message: 'Patient deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Dental FDI Chart Logic
export const updateToothStatus = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id: patientId } = req.params;
  const { toothNumber, status, notes, surfaces } = req.body;

  try {
    // 1. Enforce feature availability
    await checkSubscriptionLimit(clinicId, 'FEATURES', 'CHART');

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const encodedNotes = encodeSurfacesInNotes(surfaces, notes);

    // Upsert the tooth history status
    const existingHistory = await prisma.toothHistory.findFirst({
      where: { patientId, toothNumber: parseInt(toothNumber) },
    });

    let record;
    if (existingHistory) {
      record = await prisma.toothHistory.update({
        where: { id: existingHistory.id },
        data: { status, notes: encodedNotes },
      });
    } else {
      record = await prisma.toothHistory.create({
        data: {
          patientId,
          toothNumber: parseInt(toothNumber),
          status,
          notes: encodedNotes,
        },
      });
    }

    const decoded = decodeSurfacesFromNotes(record.notes);

    return res.json({
      ...record,
      notes: decoded.notes,
      surfaces: decoded.surfaces,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
