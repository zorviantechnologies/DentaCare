import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { z } from 'zod';

export const inventoryItemSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is too short'),
    category: z.string().min(1, 'Category is required'),
    condition: z.string().optional().nullable(),
    supplier: z.string().optional().nullable(),
    quantity: z.number().int().min(0, 'Quantity cannot be negative'),
    minQuantityAlert: z.number().int().min(0).default(5),
    expiryDate: z.string().optional().nullable(),
  }),
});

export const createInventoryItem = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { name, category, condition, supplier, quantity, minQuantityAlert, expiryDate } = req.body;

  try {
    const item = await prisma.inventoryItem.create({
      data: {
        clinicId,
        name,
        category,
        condition: condition || null,
        supplier: supplier || null,
        quantity,
        minQuantityAlert,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    return res.status(201).json(item);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getInventoryItems = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { alertOnly } = req.query;

  try {
    const whereClause: any = { clinicId };

    if (alertOnly === 'true') {
      // Query items where quantity is less than or equal to minQuantityAlert
      // or items that are expired/nearing expiry
      whereClause.OR = [
        {
          quantity: {
            lte: prisma.inventoryItem.fields.minQuantityAlert,
          },
        },
        {
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expiry within 30 days
          },
        },
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    // Custom filtering fallback in JS if SQL fields comparison is tricky
    let filteredItems = items;
    if (alertOnly === 'true') {
      filteredItems = items.filter(
        (item) =>
          item.quantity <= item.minQuantityAlert ||
          (item.expiryDate && new Date(item.expiryDate).getTime() <= Date.now() + 30 * 24 * 60 * 60 * 1000)
      );
    }

    return res.json(filteredItems);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateInventoryItem = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;
  const data = req.body;

  try {
    const item = await prisma.inventoryItem.findFirst({
      where: { id, clinicId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    if (data.expiryDate) {
      data.expiryDate = new Date(data.expiryDate);
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteInventoryItem = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;

  try {
    const item = await prisma.inventoryItem.findFirst({
      where: { id, clinicId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    await prisma.inventoryItem.delete({
      where: { id },
    });

    return res.json({ message: 'Inventory item deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
