"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInventoryItem = exports.updateInventoryItem = exports.getInventoryItems = exports.createInventoryItem = exports.inventoryItemSchema = void 0;
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
exports.inventoryItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name is too short'),
        category: zod_1.z.string().min(1, 'Category is required'),
        condition: zod_1.z.string().optional().nullable(),
        supplier: zod_1.z.string().optional().nullable(),
        quantity: zod_1.z.number().int().min(0, 'Quantity cannot be negative'),
        minQuantityAlert: zod_1.z.number().int().min(0).default(5),
        expiryDate: zod_1.z.string().optional().nullable(),
    }),
});
const createInventoryItem = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { name, category, condition, supplier, quantity, minQuantityAlert, expiryDate } = req.body;
    try {
        const item = await prisma_1.prisma.inventoryItem.create({
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
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.createInventoryItem = createInventoryItem;
const getInventoryItems = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { alertOnly } = req.query;
    try {
        const whereClause = { clinicId };
        if (alertOnly === 'true') {
            // Query items where quantity is less than or equal to minQuantityAlert
            // or items that are expired/nearing expiry
            whereClause.OR = [
                {
                    quantity: {
                        lte: prisma_1.prisma.inventoryItem.fields.minQuantityAlert,
                    },
                },
                {
                    expiryDate: {
                        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expiry within 30 days
                    },
                },
            ];
        }
        const items = await prisma_1.prisma.inventoryItem.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
        });
        // Custom filtering fallback in JS if SQL fields comparison is tricky
        let filteredItems = items;
        if (alertOnly === 'true') {
            filteredItems = items.filter((item) => item.quantity <= item.minQuantityAlert ||
                (item.expiryDate && new Date(item.expiryDate).getTime() <= Date.now() + 30 * 24 * 60 * 60 * 1000));
        }
        return res.json(filteredItems);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getInventoryItems = getInventoryItems;
const updateInventoryItem = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    const data = req.body;
    try {
        const item = await prisma_1.prisma.inventoryItem.findFirst({
            where: { id, clinicId },
        });
        if (!item) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }
        if (data.expiryDate) {
            data.expiryDate = new Date(data.expiryDate);
        }
        const updated = await prisma_1.prisma.inventoryItem.update({
            where: { id },
            data,
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.updateInventoryItem = updateInventoryItem;
const deleteInventoryItem = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    try {
        const item = await prisma_1.prisma.inventoryItem.findFirst({
            where: { id, clinicId },
        });
        if (!item) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }
        await prisma_1.prisma.inventoryItem.delete({
            where: { id },
        });
        return res.json({ message: 'Inventory item deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.deleteInventoryItem = deleteInventoryItem;
