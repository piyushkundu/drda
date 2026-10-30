import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// In-memory sync queue
interface SyncPayload {
  timestamp: string;
  source: string;
  blockName?: string;
  capturedGps?: Array<{ sno?: number; name?: string }>;
  districtStats?: Array<{ block: string; captured: number; mapped: number; total: number }>;
  rawCount?: number;
}

let latestSyncData: SyncPayload | null = null;

// CORS headers helper
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
      data: latestSyncData,
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

    latestSyncData = {
      timestamp: new Date().toISOString(),
      source: body.source || 'bookmarklet',
      blockName: body.blockName || '',
      capturedGps: body.capturedGps || [],
      districtStats: body.districtStats || [],
      rawCount: body.capturedGps ? body.capturedGps.length : 0
    };

    return NextResponse.json(
      {
        success: true,
        message: 'डेटा सफलतापूर्वक प्राप्त हुआ',
        capturedCount: latestSyncData.rawCount,
        blockName: latestSyncData.blockName,
        receivedAt: latestSyncData.timestamp
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
