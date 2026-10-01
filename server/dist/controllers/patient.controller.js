"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateToothStatus = exports.deletePatient = exports.updatePatient = exports.getPatientById = exports.getPatients = exports.createPatient = exports.patientSchema = void 0;
function encodeSurfacesInNotes(surfaces, notes) {
    const surfacesJson = JSON.stringify(surfaces || []);
    const cleanNotes = notes || '';
    return `__SURFACES__${surfacesJson}__ENDSURFACES__${cleanNotes}`;
}
function decodeSurfacesFromNotes(rawNotes) {
    if (!rawNotes || !rawNotes.startsWith('__SURFACES__')) {
        return { surfaces: [], notes: rawNotes || '' };
    }
    try {
        const endIdx = rawNotes.indexOf('__ENDSURFACES__');
        if (endIdx === -1)
            return { surfaces: [], notes: rawNotes };
        const jsonStr = rawNotes.substring('__SURFACES__'.length, endIdx);
        const notesStr = rawNotes.substring(endIdx + '__ENDSURFACES__'.length);
        return { surfaces: JSON.parse(jsonStr), notes: notesStr };
    }
    catch {
        return { surfaces: [], notes: rawNotes || '' };
    }
}
const prisma_1 = require("../prisma");
const subscription_service_1 = require("../services/subscription.service");
const zod_1 = require("zod");
exports.patientSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name is too short'),
        phone: zod_1.z.string().min(10, 'Invalid phone number'),
        email: zod_1.z.string().email('Invalid email').optional().nullable(),
        gender: zod_1.z.string().optional().nullable(),
        dob: zod_1.z.string().optional().nullable(),
        address: zod_1.z.string().optional().nullable(),
        medicalHistory: zod_1.z.array(zod_1.z.string()).default([]),
        allergies: zod_1.z.array(zod_1.z.string()).default([]),
        emergencyContact: zod_1.z.string().optional().nullable(),
        emergencyPhone: zod_1.z.string().optional().nullable(),
        familyGroupId: zod_1.z.string().optional().nullable(),
    }),
});
const createPatient = async (req, res) => {
    const clinicId = req.user?.clinicId;
    try {
        // 1. Enforce subscription limits
        await (0, subscription_service_1.checkSubscriptionLimit)(clinicId, 'PATIENTS');
        const { name, phone, email, gender, dob, address, medicalHistory, allergies, emergencyContact, emergencyPhone, familyGroupId, } = req.body;
        // 2. Generate unique patient number scoped to clinic
        const currentCount = await prisma_1.prisma.patient.count({
            where: { clinicId },
        });
        const patientNumber = `DC-${String(currentCount + 1).padStart(4, '0')}`;
        const newPatient = await prisma_1.prisma.patient.create({
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
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.createPatient = createPatient;
const getPatients = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    try {
        const whereClause = {
            clinicId,
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { patientNumber: { contains: search, mode: 'insensitive' } },
            ],
        };
        const total = await prisma_1.prisma.patient.count({ where: whereClause });
        const patients = await prisma_1.prisma.patient.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });
        const parsedPatients = patients.map((p) => ({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getPatients = getPatients;
const getPatientById = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    try {
        const patient = await prisma_1.prisma.patient.findFirst({
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
        const parsedToothHistory = (patient.toothHistory || []).map((t) => {
            const decoded = decodeSurfacesFromNotes(t.notes);
            return {
                ...t,
                notes: decoded.notes,
                surfaces: decoded.surfaces,
            };
        });
        patient.medicalHistory = JSON.parse(patient.medicalHistory || '[]');
        patient.allergies = JSON.parse(patient.allergies || '[]');
        patient.toothHistory = parsedToothHistory;
        return res.json(patient);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getPatientById = getPatientById;
const updatePatient = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    const data = req.body;
    try {
        // Prevent overriding the clinicId
        delete data.clinicId;
        delete data.patientNumber;
        const patient = await prisma_1.prisma.patient.findFirst({
            where: { id, clinicId },
        });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        if (data.dob)
            data.dob = new Date(data.dob);
        if (data.medicalHistory) {
            data.medicalHistory = JSON.stringify(data.medicalHistory);
        }
        if (data.allergies) {
            data.allergies = JSON.stringify(data.allergies);
        }
        const updated = await prisma_1.prisma.patient.update({
            where: { id },
            data,
        });
        const parsedUpdated = {
            ...updated,
            medicalHistory: JSON.parse(updated.medicalHistory || '[]'),
            allergies: JSON.parse(updated.allergies || '[]'),
        };
        return res.json(parsedUpdated);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.updatePatient = updatePatient;
const deletePatient = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    try {
        const patient = await prisma_1.prisma.patient.findFirst({
            where: { id, clinicId },
        });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        await prisma_1.prisma.patient.delete({
            where: { id },
        });
        return res.json({ message: 'Patient deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.deletePatient = deletePatient;
// Dental FDI Chart Logic
const updateToothStatus = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id: patientId } = req.params;
    const { toothNumber, status, notes, surfaces } = req.body;
    try {
        // 1. Enforce feature availability
        await (0, subscription_service_1.checkSubscriptionLimit)(clinicId, 'FEATURES', 'CHART');
        const patient = await prisma_1.prisma.patient.findFirst({
            where: { id: patientId, clinicId },
        });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        const encodedNotes = encodeSurfacesInNotes(surfaces, notes);
        // Upsert the tooth history status
        const existingHistory = await prisma_1.prisma.toothHistory.findFirst({
            where: { patientId, toothNumber: parseInt(toothNumber) },
        });
        let record;
        if (existingHistory) {
            record = await prisma_1.prisma.toothHistory.update({
                where: { id: existingHistory.id },
                data: { status, notes: encodedNotes },
            });
        }
        else {
            record = await prisma_1.prisma.toothHistory.create({
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
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.updateToothStatus = updateToothStatus;
