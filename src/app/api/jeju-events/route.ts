import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAllPages } from '../../../lib/paging-service';

// 제주도청 중앙협력본부 행사/축제 뉴스 API 페이징 처리
export async function POST(request: NextRequest) {
  try {
    const list = await fetchAllPages<any>(
      (page) => `https://www.jeju.go.kr/api/jejutoseoul/festival/?page=${page}`,
      (data) => {
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
        title: item.title ?? '',
        writeDate: item.writeDate ? new Date(item.writeDate) : new Date(),
        writer: item.writer ?? null,
        url: item.url ?? null,
        contents: item.contents ?? null,
        approved: true
      };
      await prisma.jejuEvent.upsert({ where: { seq }, create: data, update: data });
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
    const events = await prisma.jejuEvent.findMany({
      where: { approved: true },
      orderBy: { seq: 'desc' } 
    });
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PATCH /api/jeju-events (Update approval status)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { seq, approved } = body;

    if (typeof seq !== 'number' || isNaN(seq)) {
      return NextResponse.json({ success: false, error: 'Invalid sequence number' }, { status: 400 });
    }
    if (typeof approved !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid approved status' }, { status: 400 });
    }

    // Check if the record exists before updating
    const existingEvent = await prisma.jejuEvent.findUnique({
      where: { seq },
    });

    if (!existingEvent) {
      return NextResponse.json({ success: false, error: 'Jeju event not found' }, { status: 404 });
    }

    const updatedEvent = await prisma.jejuEvent.update({
      where: { seq },
      data: { approved },
    });

    return NextResponse.json({ success: true, data: updatedEvent });
  } catch (error) {
    console.error('Failed to update Jeju event approval:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
