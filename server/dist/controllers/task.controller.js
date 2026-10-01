"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getTasks = exports.createTask = exports.taskSchema = void 0;
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
exports.taskSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        description: zod_1.z.string().optional().nullable(),
        priority: zod_1.z.enum(['Low', 'Medium', 'High']).default('Medium'),
        status: zod_1.z.enum(['Todo', 'In Progress', 'Done']).default('Todo'),
        dueDate: zod_1.z.string().optional().nullable(),
        assignedToId: zod_1.z.string().uuid('Invalid user ID').optional().nullable(),
    }),
});
const createTask = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { title, description, priority, status, dueDate, assignedToId } = req.body;
    try {
        if (assignedToId) {
            const user = await prisma_1.prisma.user.findFirst({
                where: { id: assignedToId, clinicId },
            });
            if (!user) {
                return res.status(400).json({ error: 'Assigned user does not exist in this clinic' });
            }
        }
        const task = await prisma_1.prisma.task.create({
            data: {
                clinicId,
                title,
                description: description || null,
                priority,
                status,
                dueDate: dueDate ? new Date(dueDate) : null,
                assignedToId: assignedToId || null,
            },
            include: {
                assignedTo: {
                    select: { id: true, name: true },
                },
            },
        });
        return res.status(201).json(task);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.createTask = createTask;
const getTasks = async (req, res) => {
    const clinicId = req.user?.clinicId;
    try {
        const tasks = await prisma_1.prisma.task.findMany({
            where: { clinicId },
            include: {
                assignedTo: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { dueDate: 'asc' },
        });
        return res.json(tasks);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getTasks = getTasks;
const updateTask = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    const data = req.body;
    try {
        const task = await prisma_1.prisma.task.findFirst({
            where: { id, clinicId },
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        if (data.dueDate) {
            data.dueDate = new Date(data.dueDate);
        }
        const updated = await prisma_1.prisma.task.update({
            where: { id },
            data,
            include: {
                assignedTo: { select: { id: true, name: true } },
            },
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    const clinicId = req.user?.clinicId;
    const { id } = req.params;
    try {
        const task = await prisma_1.prisma.task.findFirst({
            where: { id, clinicId },
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        await prisma_1.prisma.task.delete({
            where: { id },
        });
        return res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.deleteTask = deleteTask;
