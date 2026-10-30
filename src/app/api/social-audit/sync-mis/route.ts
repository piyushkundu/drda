import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MisSyncPayload {
  timestamp: string;
  source: string;
  blockName?: string;
  auditedGps?: Array<{ sno?: number; name?: string; auditedCount?: number }>;
  districtStats?: Array<{ block: string; audited: number }>;
  rawCount?: number;
}

let latestMisSyncData: MisSyncPayload | null = null;

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: latestMisSyncData,
      serverTime: new Date().toISOString()
    },
    {
      status: 200,
      headers: getCorsHeaders()
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    latestMisSyncData = {
      timestamp: new Date().toISOString(),
      source: body.source || 'bookmarklet_r913',
      blockName: body.blockName || '',
      auditedGps: body.auditedGps || [],
      districtStats: body.districtStats || [],
      rawCount: body.auditedGps ? body.auditedGps.length : 0
    };

    return NextResponse.json(
      {
        success: true,
        message: 'MIS डेटा सफलतापूर्वक प्राप्त हुआ',
        auditedCount: latestMisSyncData.rawCount,
        blockName: latestMisSyncData.blockName,
        receivedAt: latestMisSyncData.timestamp
      },
      {
        status: 200,
        headers: getCorsHeaders()
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid JSON body'
      },
      {
        status: 400,
        headers: getCorsHeaders()
      }
    );
  }
}
