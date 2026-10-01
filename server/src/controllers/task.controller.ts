import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { z } from 'zod';

export const taskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().nullable(),
    priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
    status: z.enum(['Todo', 'In Progress', 'Done']).default('Todo'),
    dueDate: z.string().optional().nullable(),
    assignedToId: z.string().uuid('Invalid user ID').optional().nullable(),
  }),
});

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { title, description, priority, status, dueDate, assignedToId } = req.body;

  try {
    if (assignedToId) {
      const user = await prisma.user.findFirst({
        where: { id: assignedToId, clinicId },
      });
      if (!user) {
        return res.status(400).json({ error: 'Assigned user does not exist in this clinic' });
      }
    }

    const task = await prisma.task.create({
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
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  try {
    const tasks = await prisma.task.findMany({
      where: { clinicId },
      include: {
        assignedTo: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
    return res.json(tasks);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;
  const data = req.body;

  try {
    const task = await prisma.task.findFirst({
      where: { id, clinicId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (data.dueDate) {
      data.dueDate = new Date(data.dueDate);
    }

    const updated = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.user?.clinicId!;
  const { id } = req.params;

  try {
    const task = await prisma.task.findFirst({
      where: { id, clinicId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id },
    });

    return res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
