import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const letters = await prisma.letter.findMany({
      orderBy: {
        expectedReplyDate: 'asc',
      },
    });
    return NextResponse.json(letters);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching letters' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const letter = await prisma.letter.create({
      data: {
        letterNumber: data.letterNumber,
        senderName: data.senderName,
        subject: data.subject,
        dateSent: new Date(data.dateSent),
        expectedReplyDate: new Date(data.expectedReplyDate),
        sectionNumber: data.sectionNumber,
      },
    });
    return NextResponse.json(letter);
  } catch (error) {
    return NextResponse.json({ error: 'Error creating letter' }, { status: 500 });
  }
}