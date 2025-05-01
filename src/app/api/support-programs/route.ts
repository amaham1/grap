// src/app/api/support-programs/route.ts
import { NextResponse } from 'next/server';
import prisma from 'lib/prisma'; // 경로 수정: @/ 제거

export async function GET() {
  try {
    const supportPrograms = await prisma.supportProgram.findMany();
    return NextResponse.json(supportPrograms);
  } catch (error) {
    console.error('Failed to fetch support programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support programs' },
      { status: 500 }
    );
  }
}