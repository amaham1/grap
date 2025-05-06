import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { prisma } from '@/lib/prisma';

// 제주도청 복지서비스정보 API 연동
export async function POST(request: NextRequest) {
  try {
    const res = await axios.get(
      'https://www.jeju.go.kr/rest/JejuWelfareServiceInfo/getJejuWelfareServiceInfoList?numOfRows=300',
      { responseType: 'text' }
    );
    const raw = res.data;
    let dataObj: any;
    if (typeof raw === 'string') {
      try {
        const parsedXml = await parseStringPromise(raw, { explicitArray: false });
        dataObj = parsedXml?.jejunetApi?.data ?? parsedXml;
      } catch {
        dataObj = JSON.parse(raw);
      }
    } else {
      dataObj = raw;
    }
    const list = dataObj?.list ?? [];
    const items = Array.isArray(list) ? list : [list];
    let count = 0;
    for (const item of items) {
      const seq = parseInt(item.seq, 10);
      if (isNaN(seq)) continue;
      const data = {
        seq,
        name: item.name ?? '',
        allLoc: item.allLoc === 'true',
        jejuLoc: item.jejuLoc === 'true',
        seogwipoLoc: item.seogwipoLoc === 'true',
        support: item.support ?? null,
        contents: item.contents ?? null,
        application: item.application ?? null,
        approved: true
      };
      await prisma.welfareService.upsert({ where: { seq }, create: data, update: data });
      count++;
    }
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const services = await prisma.welfareService.findMany({ orderBy: { seq: 'desc' } });
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PATCH /api/welfare-services (Update approval status)
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
    const existingService = await prisma.welfareService.findUnique({
      where: { seq },
    });

    if (!existingService) {
      return NextResponse.json({ success: false, error: 'Welfare service not found' }, { status: 404 });
    }

    const updatedService = await prisma.welfareService.update({
      where: { seq },
      data: { approved },
    });

    return NextResponse.json({ success: true, data: updatedService });
  } catch (error) {
    console.error('Failed to update welfare service approval:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
