"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRecall = exports.updateRecall = exports.getRecalls = exports.createRecall = exports.recallSchema = void 0;
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
exports.recallSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string().uuid('Invalid patient ID'),
        recallType: zod_1.z.enum([
            'ROUTINE_CHECKUP',
            'CLEANING',
            'FOLLOW_UP',
            'ORTHODONTIC_REVIEW',
            'PERIODONTAL_REVIEW',
            'IMPLANT_REVIEW',
        ]),
        dueDate: zod_1.z.string(),
        status: zod_1.z.enum(['Pending', 'Contacted', 'Scheduled', 'Cancelled']).default('Pending'),
        notes: zod_1.z.string().optional().nullable(),
    }),
});
const createRecall = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { patientId, recallType, dueDate, status, notes } = req.body;
    try {
        const patient = await prisma_1.prisma.patient.findFirst({
            where: { id: patientId, clinicId },
        });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        const recall = await prisma_1.prisma.recall.create({
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
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.createRecall = createRecall;
const getRecalls = async (req, res) => {
    const clinicId = req.user?.clinicId;
    try {
        const recalls = await prisma_1.prisma.recall.findMany({
            where: { clinicId },
            include: {
                patient: { select: { name: true, phone: true, patientNumber: true } },
            },
            orderBy: { dueDate: 'asc' },
        });
        return res.json(recalls);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getRecalls = getRecalls;
const updateRecall = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    const data = req.body;
    try {
        const recall = await prisma_1.prisma.recall.findFirst({
            where: { id, clinicId },
        });
        if (!recall) {
            return res.status(404).json({ error: 'Recall not found' });
        }
        if (data.dueDate) {
            data.dueDate = new Date(data.dueDate);
        }
        const updated = await prisma_1.prisma.recall.update({
            where: { id },
            data,
            include: {
                patient: { select: { name: true, phone: true } },
            },
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.updateRecall = updateRecall;
const deleteRecall = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    try {
        const recall = await prisma_1.prisma.recall.findFirst({
            where: { id, clinicId },
        });
        if (!recall) {
            return res.status(404).json({ error: 'Recall not found' });
        }
        await prisma_1.prisma.recall.delete({
            where: { id },
        });
        return res.json({ message: 'Recall deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.deleteRecall = deleteRecall;
