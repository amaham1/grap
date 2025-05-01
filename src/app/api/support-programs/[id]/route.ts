import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  // ID가 숫자인지 확인하고 변환합니다.
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const supportProgram = await prisma.supportProgram.findUnique({
      where: { id: numericId },
    });

    if (!supportProgram) {
      return NextResponse.json({ error: 'Support program not found' }, { status: 404 });
    }

    return NextResponse.json(supportProgram);
  } catch (error) {
    console.error('Failed to fetch support program:', error);
    // 데이터베이스 오류 또는 기타 서버 오류 처리
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}