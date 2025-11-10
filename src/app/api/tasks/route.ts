import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod'; // Para validación (seguridad)

const prisma = new PrismaClient();

// Schema de validación corregido: max() ANTES de optional()
const createTaskSchema = z.object({
  title: z.string().min(1, 'Título requerido').max(255),
  description: z.string().max(1000).optional(), // Fix: max() en el ZodString base
});

export async function GET() {
  // SRP: Solo lee tareas (READ)
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' }, // Orden simple para UX
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Error al obtener tareas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // SRP: Solo crea tarea (CREATE), con estado inicial "pendiente"
  try {
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body); // Valida inputs

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        status: 'pendiente', // Requerimiento funcional
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 }); // Fix: .issues en lugar de .errors
    }
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Error al crear tarea' }, { status: 500 });
  }
}