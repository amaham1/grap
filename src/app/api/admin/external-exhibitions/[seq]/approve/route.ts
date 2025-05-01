import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { seq: string } }
) {
  try {
    const seq = parseInt(params.seq, 10);
    if (isNaN(seq)) {
      return NextResponse.json({ success: false, error: 'Invalid seq parameter' }, { status: 400 });
    }
    const body = await request.json();
    const { approved } = body;
    if (typeof approved !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid approved flag' }, { status: 400 });
    }
    const updated = await prisma.externalExhibition.update({
      where: { seq },
      data: { approved },
    });
    return NextResponse.json({ success: true, exhibition: updated });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
