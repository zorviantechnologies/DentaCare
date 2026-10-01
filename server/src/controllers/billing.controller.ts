import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { checkSubscriptionLimit } from '../services/subscription.service';
import { z } from 'zod';

export const invoiceSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    visitId: z.string().uuid('Invalid visit ID').optional().nullable(),
    subtotal: z.number().min(0, 'Subtotal cannot be negative'),
    discount: z.number().min(0, 'Discount cannot be negative').default(0),
    cgst: z.number().min(0).max(100).default(0), // percentage
    sgst: z.number().min(0).max(100).default(0), // percentage
    dueDate: z.string().optional().nullable(),
  }),
});

export const createInvoice = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { patientId, visitId, subtotal, discount, cgst, sgst, dueDate } = req.body;

  try {
    // 1. Check patient access
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // 2. Validate GST Billing limits (GST requires BASIC or PRO tier)
    if (cgst > 0 || sgst > 0) {
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
      if (clinic?.subscription === 'FREE') {
        return res.status(403).json({
          error: 'GST Billing (CGST/SGST) is only available on BASIC and PRO plans. Please upgrade.',
        });
      }
    }

    // Calculate invoice totals
    const taxableAmount = Math.max(0, subtotal - discount);
    const cgstAmount = taxableAmount * (cgst / 100);
    const sgstAmount = taxableAmount * (sgst / 100);
    const total = taxableAmount + cgstAmount + sgstAmount;

    // Generate Invoice Number scoped to clinic
    const invoiceCount = await prisma.invoice.count({ where: { clinicId } });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(5, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        clinicId,
        patientId,
        visitId: visitId || null,
        invoiceNumber,
        subtotal,
        discount,
        taxableAmount,
        cgst,
        sgst,
        total,
        balance: total,
        paymentStatus: 'UNPAID',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        patient: true,
      },
    });

    return res.status(201).json(invoice);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getInvoices = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;

  try {
    const invoices = await prisma.invoice.findMany({
      where: { clinicId },
      include: {
        patient: {
          select: { name: true, patientNumber: true, phone: true },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(invoices);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getInvoiceById = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        payments: true,
        visit: {
          include: {
            prescription: {
              include: { items: true },
            },
          },
        },
      },
    });

    if (!invoice || invoice.clinicId !== clinicId) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json(invoice);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const addPayment = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { invoiceId, amount, paymentMode, referenceNumber } = req.body;

  try {
    // Check if invoice belongs to this clinic
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, clinicId },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }

    const newPayment = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount,
          paymentMode,
          referenceNumber: referenceNumber || null,
        },
      });

      // Recalculate balance on invoice
      const updatedBalance = Math.max(0, invoice.balance - amount);
      let paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';

      if (updatedBalance === 0) {
        paymentStatus = 'PAID';
      } else if (updatedBalance < invoice.total) {
        paymentStatus = 'PARTIAL';
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          balance: updatedBalance,
          paymentStatus,
        },
      });

      return payment;
    });

    return res.status(201).json(newPayment);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

// Daily Summary Report for Billing
export const getDailySummary = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  try {
    // 1. Get invoices generated today
    const invoices = await prisma.invoice.findMany({
      where: {
        clinicId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: { patient: { select: { name: true } } },
    });

    // 2. Get payments received today (can be for previous invoices)
    const payments = await prisma.payment.findMany({
      where: {
        invoice: { clinicId },
        paymentDate: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        invoice: {
          include: { patient: { select: { name: true } } },
        },
      },
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCollections = payments.reduce((sum, p) => sum + p.amount, 0);

    // Group collections by payment mode
    const modeBreakdown: Record<string, number> = {
      CASH: 0,
      UPI: 0,
      CARD: 0,
      CHEQUE: 0,
      NET_BANKING: 0,
    };
    payments.forEach((p) => {
      modeBreakdown[p.paymentMode] = (modeBreakdown[p.paymentMode] || 0) + p.amount;
    });

    return res.json({
      date: dateStr,
      totalRevenue,
      totalCollections,
      invoices,
      payments,
      modeBreakdown,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
