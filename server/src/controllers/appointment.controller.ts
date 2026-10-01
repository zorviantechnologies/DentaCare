import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { z } from 'zod';

export const appointmentSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    doctorId: z.string().uuid('Invalid doctor ID'),
    dateTime: z.string().datetime('Invalid datetime string'),
    durationMinutes: z.number().int().min(5).max(480).default(30),
    reason: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    status: z.enum(['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).default('SCHEDULED'),
  }),
});

export const createAppointment = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { patientId, doctorId, dateTime, durationMinutes, reason, notes, status } = req.body;

  try {
    // Check if patient belongs to clinic
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });
    if (!patient) {
      return res.status(400).json({ error: 'Patient not found in this clinic' });
    }

    // Check if doctor belongs to clinic
    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, clinicId, isActive: true },
    });
    if (!doctor) {
      return res.status(400).json({ error: 'Active doctor not found in this clinic' });
    }

    const appointment = await prisma.appointment.create({
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
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getAppointments = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { start, end, doctorId } = req.query;

  try {
    const whereClause: any = {
      clinicId,
    };

    if (start && end) {
      whereClause.dateTime = {
        gte: new Date(start as string),
        lte: new Date(end as string),
      };
    }

    if (doctorId) {
      whereClause.doctorId = doctorId as string;
    }

    const appointments = await prisma.appointment.findMany({
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateAppointment = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;
  const data = req.body;

  try {
    const appointment = await prisma.appointment.findFirst({
      where: { id, clinicId },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (data.dateTime) {
      data.dateTime = new Date(data.dateTime);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: true,
      },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteAppointment = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;

  try {
    const appointment = await prisma.appointment.findFirst({
      where: { id, clinicId },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    return res.json({ message: 'Appointment deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
