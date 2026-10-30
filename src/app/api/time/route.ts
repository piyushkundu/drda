import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const now = new Date();
    
    // Delhi / Asia/Kolkata formatter
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const timeFormatter12 = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const timeFormatter24 = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const dateStr = dateFormatter.format(now); // "YYYY-MM-DD"
    const time12 = timeFormatter12.format(now); // e.g. "12:15:30 AM"
    const time24 = timeFormatter24.format(now); // e.g. "00:15:30"

    const response = NextResponse.json({
      date: dateStr,
      time: time24,
      time12: time12,
      timezone: 'Asia/Kolkata (नई दिल्ली)',
      timestamp: now.getTime(),
      iso: now.toISOString(),
      status: 'synced'
    });

    // Ensure no intermediate proxy or browser caches the time
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || 'Failed to get server time',
      date: new Date().toISOString().slice(0, 10),
      timestamp: Date.now()
    }, { status: 500 });
  }
}
