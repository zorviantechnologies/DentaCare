"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTreatmentPlanItemStatus = exports.getPatientTreatmentPlans = exports.createTreatmentPlan = exports.deleteTreatment = exports.updateTreatment = exports.getTreatments = exports.createTreatment = exports.treatmentPlanSchema = exports.treatmentSchema = void 0;
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
exports.treatmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        category: zod_1.z.string().min(1, 'Category is required'),
        name: zod_1.z.string().min(1, 'Name is required'),
        description: zod_1.z.string().optional().nullable(),
        defaultCost: zod_1.z.number().min(0, 'Default cost cannot be negative'),
        isActive: zod_1.z.boolean().default(true),
    }),
});
exports.treatmentPlanSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string().uuid('Invalid patient ID'),
        name: zod_1.z.string().min(1, 'Plan name is required'),
        status: zod_1.z.string().default('Active'),
        stages: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string().min(1, 'Stage name is required'),
            order: zod_1.z.number().int(),
            items: zod_1.z.array(zod_1.z.object({
                treatmentName: zod_1.z.string().min(1, 'Treatment name is required'),
                toothNumbers: zod_1.z.array(zod_1.z.number().int()),
                cost: zod_1.z.number().min(0),
                discount: zod_1.z.number().min(0).default(0),
                status: zod_1.z.string().default('Pending'),
            })),
        })),
    }),
});
// Treatment Catalog APIs
const createTreatment = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { category, name, description, defaultCost, isActive } = req.body;
    try {
        const treatment = await prisma_1.prisma.treatment.create({
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
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.createTreatment = createTreatment;
const getTreatments = async (req, res) => {
    const clinicId = req.user?.clinicId;
    try {
        const treatments = await prisma_1.prisma.treatment.findMany({
            where: { clinicId },
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
        return res.json(treatments);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getTreatments = getTreatments;
const updateTreatment = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    const data = req.body;
    try {
        const treatment = await prisma_1.prisma.treatment.findFirst({
            where: { id, clinicId },
        });
        if (!treatment) {
            return res.status(404).json({ error: 'Treatment catalog item not found' });
        }
        const updated = await prisma_1.prisma.treatment.update({
            where: { id },
            data,
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.updateTreatment = updateTreatment;
const deleteTreatment = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    try {
        const treatment = await prisma_1.prisma.treatment.findFirst({
            where: { id, clinicId },
        });
        if (!treatment) {
            return res.status(404).json({ error: 'Treatment catalog item not found' });
        }
        await prisma_1.prisma.treatment.delete({
            where: { id },
        });
        return res.json({ message: 'Treatment catalog item deleted' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.deleteTreatment = deleteTreatment;
// Treatment Plan APIs
const createTreatmentPlan = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { patientId, name, status, stages } = req.body;
    try {
        // Check patient access
        const patient = await prisma_1.prisma.patient.findFirst({
            where: { id: patientId, clinicId },
        });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found in this clinic' });
        }
        // Create TreatmentPlan inside a transaction
        const newPlan = await prisma_1.prisma.$transaction(async (tx) => {
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
                        data: stage.items.map((item) => ({
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
        const fullPlan = await prisma_1.prisma.treatmentPlan.findUnique({
            where: { id: newPlan.id },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                    include: { items: true },
                },
            },
        });
        if (fullPlan) {
            fullPlan.stages.forEach((stage) => {
                stage.items.forEach((item) => {
                    item.toothNumbers = item.toothNumbers ? item.toothNumbers.split(',').map(Number) : [];
                });
            });
        }
        return res.status(201).json(fullPlan);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.createTreatmentPlan = createTreatmentPlan;
const getPatientTreatmentPlans = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { patientId } = req.params;
    try {
        const plans = await prisma_1.prisma.treatmentPlan.findMany({
            where: { patientId, clinicId },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                    include: { items: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        plans.forEach((plan) => {
            plan.stages.forEach((stage) => {
                stage.items.forEach((item) => {
                    item.toothNumbers = item.toothNumbers ? item.toothNumbers.split(',').map(Number) : [];
                });
            });
        });
        return res.json(plans);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getPatientTreatmentPlans = getPatientTreatmentPlans;
const updateTreatmentPlanItemStatus = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { itemId } = req.params;
    const { status } = req.body;
    try {
        // Find item verify patient access
        const item = await prisma_1.prisma.treatmentPlanItem.findUnique({
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
        const updated = await prisma_1.prisma.treatmentPlanItem.update({
            where: { id: itemId },
            data: { status },
        });
        const parsedUpdated = {
            ...updated,
            toothNumbers: updated.toothNumbers ? updated.toothNumbers.split(',').map(Number) : [],
        };
        return res.json(parsedUpdated);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.updateTreatmentPlanItemStatus = updateTreatmentPlanItemStatus;
