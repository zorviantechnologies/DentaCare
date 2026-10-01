"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVisitById = exports.getPatientVisits = exports.createVisit = exports.visitSchema = void 0;
const prisma_1 = require("../prisma");
const subscription_service_1 = require("../services/subscription.service");
const zod_1 = require("zod");
exports.visitSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string().uuid('Invalid patient ID'),
        chiefComplaint: zod_1.z.string().min(1, 'Chief complaint is required'),
        diagnosis: zod_1.z.string().optional().nullable(),
        clinicalNotes: zod_1.z.string().optional().nullable(),
        toothChartSnapshot: zod_1.z.any().optional(),
        prescription: zod_1.z.object({
            doctorSignature: zod_1.z.string().optional().nullable(),
            items: zod_1.z.array(zod_1.z.object({
                medicineName: zod_1.z.string().min(1, 'Medicine name is required'),
                dosage: zod_1.z.string().min(1, 'Dosage is required (e.g. 1-0-1)'),
                durationDays: zod_1.z.number().int().min(1, 'Duration must be at least 1 day'),
                instructions: zod_1.z.string().optional().nullable(),
            })),
        }).optional().nullable(),
    }),
});
const createVisit = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { patientId, chiefComplaint, diagnosis, clinicalNotes, toothChartSnapshot, prescription } = req.body;
    try {
        // 1. Check patient access
        const patient = await prisma_1.prisma.patient.findFirst({
            where: { id: patientId, clinicId },
        });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found in this clinic' });
        }
        // 2. Gate check for Prescription features if prescription items are added
        if (prescription && prescription.items && prescription.items.length > 0) {
            await (0, subscription_service_1.checkSubscriptionLimit)(clinicId, 'FEATURES', 'PRESCRIPTIONS');
        }
        // 3. Create visit + prescription (within a transaction)
        const newVisit = await prisma_1.prisma.$transaction(async (tx) => {
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
                            create: prescription.items.map((item) => ({
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
        const fullVisit = await prisma_1.prisma.visit.findUnique({
            where: { id: newVisit.id },
            include: {
                prescription: {
                    include: { items: true },
                },
            },
        });
        return res.status(201).json(fullVisit);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.createVisit = createVisit;
const getPatientVisits = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { patientId } = req.params;
    try {
        // Check patient access
        const patient = await prisma_1.prisma.patient.findFirst({
            where: { id: patientId, clinicId },
        });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        const visits = await prisma_1.prisma.visit.findMany({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getPatientVisits = getPatientVisits;
const getVisitById = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    try {
        const visit = await prisma_1.prisma.visit.findUnique({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getVisitById = getVisitById;
