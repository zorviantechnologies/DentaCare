import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { z } from 'zod';

export const recallSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    recallType: z.enum([
      'ROUTINE_CHECKUP',
      'CLEANING',
      'FOLLOW_UP',
      'ORTHODONTIC_REVIEW',
      'PERIODONTAL_REVIEW',
      'IMPLANT_REVIEW',
    ]),
    dueDate: z.string(),
    status: z.enum(['Pending', 'Contacted', 'Scheduled', 'Cancelled']).default('Pending'),
    notes: z.string().optional().nullable(),
  }),
});

export const createRecall = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { patientId, recallType, dueDate, status, notes } = req.body;

  try {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const recall = await prisma.recall.create({
      data: {
        clinicId,
        patientId,
        recallType,
        dueDate: new Date(dueDate),
        status,
        notes: notes || null,
      },
      include: {
        patient: { select: { name: true, phone: true } },
      },
    });

    return res.status(201).json(recall);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getRecalls = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;

  try {
    const recalls = await prisma.recall.findMany({
      where: { clinicId },
      include: {
        patient: { select: { name: true, phone: true, patientNumber: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return res.json(recalls);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateRecall = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;
  const data = req.body;

  try {
    const recall = await prisma.recall.findFirst({
      where: { id, clinicId },
    });

    if (!recall) {
      return res.status(404).json({ error: 'Recall not found' });
    }

    if (data.dueDate) {
      data.dueDate = new Date(data.dueDate);
    }

    const updated = await prisma.recall.update({
      where: { id },
      data,
      include: {
        patient: { select: { name: true, phone: true } },
      },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteRecall = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;

  try {
    const recall = await prisma.recall.findFirst({
      where: { id, clinicId },
    });

    if (!recall) {
      return res.status(404).json({ error: 'Recall not found' });
    }

    await prisma.recall.delete({
      where: { id },
    });

    return res.json({ message: 'Recall deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
