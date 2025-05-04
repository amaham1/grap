import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAllPages } from '../../../lib/paging-service';

// 전시문화 행사 API 연동
export async function POST(request: NextRequest) {
  try {
    const list = await fetchAllPages<any>(
      (page: number) => `https://www.jejunolda.com/api/event/?page=${page}`,
      (data: any): any[] => {
        const items = data.items ?? data;
        return Array.isArray(items) ? items : [items];
      }
    );
    let count = 0;
    for (const item of list) {
      const seq = Number(item.seq);
      if (isNaN(seq)) continue;
      const data = {
        seq,
        no: item.no ? Number(item.no) : null,
        title: item.name ?? '',
        writeDate: item.start ? new Date(item.start) : new Date(),
        writer: item.writer ?? item.ownerName ?? null,
        url: item.link ?? item.poster ?? null,
        contents: item.intro ?? null,
        approved: true
      };
      await prisma.junoldaEvent.upsert({ where: { seq }, create: data, update: data });
      count++;
    }
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const events = await prisma.junoldaEvent.findMany({ orderBy: { seq: 'asc' } });
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PATCH /api/junolda-events (Update approval status)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, approved } = body; // Junolda uses 'id' instead of 'seq'

    if (typeof id !== 'number' || isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }
    if (typeof approved !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid approved status' }, { status: 400 });
    }

    // Check if the record exists before updating
    const existingEvent = await prisma.junoldaEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ success: false, error: 'Junolda event not found' }, { status: 404 });
    }

    const updatedEvent = await prisma.junoldaEvent.update({
      where: { id },
      data: { approved },
    });

    return NextResponse.json({ success: true, data: updatedEvent });
  } catch (error) {
    console.error('Failed to update Junolda event approval:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
