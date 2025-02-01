import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const letter = await prisma.letter.update({
      where: {
        id: params.id,
      },
      data: {
        received: true,
      },
    });
    return NextResponse.json(letter);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error updating letter status' },
      { status: 500 }
    );
  }
}