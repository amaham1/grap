import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 전시문화 행사 단일 승인/비승인 처리 라우트
export async function PATCH(request: NextRequest, { params }: { params: { seq: string } }) {
  try {
    const { approved } = (await request.json()) as { approved: boolean };
    const seqNum = parseInt(params.seq, 10);
    if (isNaN(seqNum)) {
      return NextResponse.json({ success: false, error: 'Invalid seq' }, { status: 400 });
    }
    const event = await prisma.junoldaEvent.update({
      where: { seq: seqNum },
      data: { approved },
    });
    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
