import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema para update (solo estado, por SRP)
const updateTaskSchema = z.object({
  status: z.enum(['pendiente', 'en progreso', 'completada'], 'Estado inválido'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // SRP: Solo actualiza estado (UPDATE), auto-actualiza updatedAt
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Verifica si existe (buena práctica)
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: validatedData,
    });
    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 }); // Fix: .issues
    }
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Error al actualizar tarea' }, { status: 500 });
  }
}