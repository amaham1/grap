import { NextResponse } from 'next/server';
import prisma from 'lib/prisma';
import { Prisma } from '@prisma/client';

interface Params {
  id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Failed to fetch event:', error);

    // Prisma 관련 에러 처리 (예: 레코드 찾기 실패 외 다른 DB 문제)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 구체적인 Prisma 에러 코드에 따라 다른 처리 가능
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 그 외 서버 내부 에러
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}