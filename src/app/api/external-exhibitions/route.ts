import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const response = await axios.get('http://www.jeju.go.kr/rest/JejuExhibitionService/getJejucultureExhibitionList');
    const rawData = response.data;
    let items: any;
    if (typeof rawData === 'string') {
      const trimmed = rawData.trim();
      if (trimmed.startsWith('<')) {
        // XML response
        const xmlResult = await parseStringPromise(rawData, { explicitArray: false });
        items = xmlResult?.response?.body?.items?.item;
      } else {
        // JSON string response
        items = JSON.parse(rawData);
      }
    } else {
      // Already JSON object
      items = (rawData as any).response?.body?.items?.item ?? (rawData as any).items ?? rawData;
    }
    const list = Array.isArray(items) ? items : [items];
    if (list.length === 0) {
      return NextResponse.json({ success: false, error: 'No items found' }, { status: 404 });
    }
    let count = 0;
    for (const item of list) {
      const seq = parseInt(item.seq, 10);
      if (isNaN(seq)) continue;
      const data = {
        seq,
        title: item.title ?? '',
        category: item.category ?? null,
        categoryName: item.categoryName ?? null,
        cover: item.cover ?? null,
        coverThumb: item.coverThumb ?? null,
        startDate: item.startDate ? new Date(item.startDate) : null,
        endDate: item.endDate ? new Date(item.endDate) : null,
        hour: item.hour ?? null,
        pay: item.pay ?? null,
        locs: item.locs ?? null,
        locNames: item.locNames ?? null,
        owner: item.owner ?? null,
        tel: item.tel ?? null,
        stat: item.stat ?? null,
        divName: item.divName ?? null,
        intro: item.intro ?? null,
      };
      await prisma.externalExhibition.upsert({
        where: { seq },
        create: data,
        update: data,
      });
      count++;
    }
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // public listing with optional approval filter
  const { searchParams } = request.nextUrl;
  const approvedParam = searchParams.get('approved');
  const where = approvedParam !== null ? { approved: approvedParam === 'true' } : {};
  const data = await prisma.externalExhibition.findMany({ where, orderBy: { seq: 'asc' } });
  return NextResponse.json({ success: true, data });
}
