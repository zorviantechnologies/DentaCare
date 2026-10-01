import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { checkSubscriptionLimit } from '../services/subscription.service';
import { z } from 'zod';

export const visitSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    chiefComplaint: z.string().min(1, 'Chief complaint is required'),
    diagnosis: z.string().optional().nullable(),
    clinicalNotes: z.string().optional().nullable(),
    toothChartSnapshot: z.any().optional(),
    prescription: z.object({
      doctorSignature: z.string().optional().nullable(),
      items: z.array(
        z.object({
          medicineName: z.string().min(1, 'Medicine name is required'),
          dosage: z.string().min(1, 'Dosage is required (e.g. 1-0-1)'),
          durationDays: z.number().int().min(1, 'Duration must be at least 1 day'),
          instructions: z.string().optional().nullable(),
        })
      ),
    }).optional().nullable(),
  }),
});

export const createVisit = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { patientId, chiefComplaint, diagnosis, clinicalNotes, toothChartSnapshot, prescription } = req.body;

  try {
    // 1. Check patient access
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found in this clinic' });
    }

    // 2. Gate check for Prescription features if prescription items are added
    if (prescription && prescription.items && prescription.items.length > 0) {
      await checkSubscriptionLimit(clinicId, 'FEATURES', 'PRESCRIPTIONS');
    }

    // 3. Create visit + prescription (within a transaction)
    const newVisit = await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.create({
        data: {
          patientId,
          chiefComplaint,
          diagnosis: diagnosis || null,
          clinicalNotes: clinicalNotes || null,
          toothChartSnapshot: toothChartSnapshot || null,
        },
      });

      if (prescription && prescription.items && prescription.items.length > 0) {
        await tx.prescription.create({
          data: {
            visitId: visit.id,
            doctorSignature: prescription.doctorSignature || req.user?.name || '',
            items: {
              create: prescription.items.map((item: any) => ({
                medicineName: item.medicineName,
                dosage: item.dosage,
                durationDays: item.durationDays,
                instructions: item.instructions || null,
              })),
            },
          },
        });
      }

      return visit;
    });

    const fullVisit = await prisma.visit.findUnique({
      where: { id: newVisit.id },
      include: {
        prescription: {
          include: { items: true },
        },
      },
    });

    return res.status(201).json(fullVisit);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getPatientVisits = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { patientId } = req.params;

  try {
    // Check patient access
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const visits = await prisma.visit.findMany({
      where: { patientId },
      include: {
        prescription: {
          include: { items: true },
        },
        invoice: {
          include: { payments: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return res.json(visits);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getVisitById = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;

  try {
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            clinicId: true,
            name: true,
            patientNumber: true,
            phone: true,
          },
        },
        prescription: {
          include: { items: true },
        },
        invoice: {
          include: { payments: true },
        },
      },
    });

    if (!visit || visit.patient.clinicId !== clinicId) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    return res.json(visit);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
