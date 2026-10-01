"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAppointment = exports.updateAppointment = exports.getAppointments = exports.createAppointment = exports.appointmentSchema = void 0;
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
exports.appointmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string().uuid('Invalid patient ID'),
        doctorId: zod_1.z.string().uuid('Invalid doctor ID'),
        dateTime: zod_1.z.string().datetime('Invalid datetime string'),
        durationMinutes: zod_1.z.number().int().min(5).max(480).default(30),
        reason: zod_1.z.string().optional().nullable(),
        notes: zod_1.z.string().optional().nullable(),
        status: zod_1.z.enum(['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).default('SCHEDULED'),
    }),
});
const createAppointment = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { patientId, doctorId, dateTime, durationMinutes, reason, notes, status } = req.body;
    try {
        // Check if patient belongs to clinic
        const patient = await prisma_1.prisma.patient.findFirst({
            where: { id: patientId, clinicId },
        });
        if (!patient) {
            return res.status(400).json({ error: 'Patient not found in this clinic' });
        }
        // Check if doctor belongs to clinic
        const doctor = await prisma_1.prisma.user.findFirst({
            where: { id: doctorId, clinicId, isActive: true },
        });
        if (!doctor) {
            return res.status(400).json({ error: 'Active doctor not found in this clinic' });
        }
        const appointment = await prisma_1.prisma.appointment.create({
            data: {
                clinicId,
                patientId,
                doctorId,
                dateTime: new Date(dateTime),
                durationMinutes,
                reason: reason || null,
                notes: notes || null,
                status,
            },
            include: {
                patient: true,
                doctor: true,
            },
        });
        return res.status(201).json(appointment);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.createAppointment = createAppointment;
const getAppointments = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { start, end, doctorId } = req.query;
    try {
        const whereClause = {
            clinicId,
        };
        if (start && end) {
            whereClause.dateTime = {
                gte: new Date(start),
                lte: new Date(end),
            };
        }
        if (doctorId) {
            whereClause.doctorId = doctorId;
        }
        const appointments = await prisma_1.prisma.appointment.findMany({
            where: whereClause,
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        patientNumber: true,
                    },
                },
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: { dateTime: 'asc' },
        });
        return res.json(appointments);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getAppointments = getAppointments;
const updateAppointment = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    const data = req.body;
    try {
        const appointment = await prisma_1.prisma.appointment.findFirst({
            where: { id, clinicId },
        });
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (data.dateTime) {
            data.dateTime = new Date(data.dateTime);
        }
        const updated = await prisma_1.prisma.appointment.update({
            where: { id },
            data,
            include: {
                patient: true,
                doctor: true,
            },
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.updateAppointment = updateAppointment;
const deleteAppointment = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    try {
        const appointment = await prisma_1.prisma.appointment.findFirst({
            where: { id, clinicId },
        });
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        await prisma_1.prisma.appointment.delete({
            where: { id },
        });
        return res.json({ message: 'Appointment deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.deleteAppointment = deleteAppointment;
