import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { z } from 'zod';

export const treatmentSchema = z.object({
  body: z.object({
    category: z.string().min(1, 'Category is required'),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().nullable(),
    defaultCost: z.number().min(0, 'Default cost cannot be negative'),
    isActive: z.boolean().default(true),
  }),
});

export const treatmentPlanSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    name: z.string().min(1, 'Plan name is required'),
    status: z.string().default('Active'),
    stages: z.array(
      z.object({
        name: z.string().min(1, 'Stage name is required'),
        order: z.number().int(),
        items: z.array(
          z.object({
            treatmentName: z.string().min(1, 'Treatment name is required'),
            toothNumbers: z.array(z.number().int()),
            cost: z.number().min(0),
            discount: z.number().min(0).default(0),
            status: z.string().default('Pending'),
          })
        ),
      })
    ),
  }),
});

// Treatment Catalog APIs
export const createTreatment = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { category, name, description, defaultCost, isActive } = req.body;

  try {
    const treatment = await prisma.treatment.create({
      data: {
        clinicId,
        category,
        name,
        description: description || null,
        defaultCost,
        isActive,
      },
    });
    return res.status(201).json(treatment);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getTreatments = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  try {
    const treatments = await prisma.treatment.findMany({
      where: { clinicId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return res.json(treatments);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateTreatment = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;
  const data = req.body;

  try {
    const treatment = await prisma.treatment.findFirst({
      where: { id, clinicId },
    });
    if (!treatment) {
      return res.status(404).json({ error: 'Treatment catalog item not found' });
    }
    const updated = await prisma.treatment.update({
      where: { id },
      data,
    });
    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteTreatment = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;

  try {
    const treatment = await prisma.treatment.findFirst({
      where: { id, clinicId },
    });
    if (!treatment) {
      return res.status(404).json({ error: 'Treatment catalog item not found' });
    }
    await prisma.treatment.delete({
      where: { id },
    });
    return res.json({ message: 'Treatment catalog item deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Treatment Plan APIs
export const createTreatmentPlan = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { patientId, name, status, stages } = req.body;

  try {
    // Check patient access
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found in this clinic' });
    }

    // Create TreatmentPlan inside a transaction
    const newPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.create({
        data: {
          clinicId,
          patientId,
          name,
          status,
        },
      });

      for (const stage of stages) {
        const createdStage = await tx.treatmentPlanStage.create({
          data: {
            treatmentPlanId: plan.id,
            name: stage.name,
            order: stage.order,
          },
        });

        if (stage.items && stage.items.length > 0) {
          await tx.treatmentPlanItem.createMany({
            data: stage.items.map((item: any) => ({
              treatmentPlanStageId: createdStage.id,
              treatmentName: item.treatmentName,
              toothNumbers: (item.toothNumbers || []).join(','),
              cost: item.cost,
              discount: item.discount,
              status: item.status,
            })),
          });
        }
      }

      return plan;
    });

    const fullPlan = await prisma.treatmentPlan.findUnique({
      where: { id: newPlan.id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: { items: true },
        },
      },
    });

    if (fullPlan) {
      fullPlan.stages.forEach((stage: any) => {
        stage.items.forEach((item: any) => {
          item.toothNumbers = item.toothNumbers ? item.toothNumbers.split(',').map(Number) : [];
        });
      });
    }

    return res.status(201).json(fullPlan);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getPatientTreatmentPlans = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { patientId } = req.params;

  try {
    const plans = await prisma.treatmentPlan.findMany({
      where: { patientId, clinicId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    plans.forEach((plan: any) => {
      plan.stages.forEach((stage: any) => {
        stage.items.forEach((item: any) => {
          item.toothNumbers = item.toothNumbers ? item.toothNumbers.split(',').map(Number) : [];
        });
      });
    });

    return res.json(plans);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateTreatmentPlanItemStatus = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { itemId } = req.params;
  const { status } = req.body;

  try {
    // Find item verify patient access
    const item = await prisma.treatmentPlanItem.findUnique({
      where: { id: itemId },
      include: {
        stage: {
          include: {
            treatmentPlan: true,
          },
        },
      },
    });

    if (!item || item.stage.treatmentPlan.clinicId !== clinicId) {
      return res.status(404).json({ error: 'Treatment plan item not found' });
    }

    const updated = await prisma.treatmentPlanItem.update({
      where: { id: itemId },
      data: { status },
    });

    const parsedUpdated = {
      ...updated,
      toothNumbers: updated.toothNumbers ? updated.toothNumbers.split(',').map(Number) : [],
    };

    return res.json(parsedUpdated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
