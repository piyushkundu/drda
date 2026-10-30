// ============================================================================
// Delhi (IST - Asia/Kolkata) Date & Time Synchronization Utility
// Ensures the Social Audit portal is strictly aligned with Indian Standard Time (UTC+05:30)
// ============================================================================

/**
 * Returns today's date string formatted as YYYY-MM-DD in Asia/Kolkata timezone (Delhi/IST).
 */
export function getDelhiDateString(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date);
  } catch (err) {
    // Fallback if Intl fails
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + istOffset);
    return istDate.toISOString().slice(0, 10);
  }
}

/**
 * Returns formatted 12-hour time in Delhi (IST) with seconds, e.g. "12:15:30 AM"
 */
export function getDelhiTimeString(date: Date = new Date(), includeSeconds: boolean = true): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true
    }).format(date);
  } catch {
    return date.toLocaleTimeString('en-US');
  }
}

/**
 * Returns Hindi day name in Asia/Kolkata
 */
export function getDelhiDayNameHindi(dateStr: string): string {
  const days: Record<number, string> = {
    0: 'रविवार',
    1: 'सोमवार',
    2: 'मंगलवार',
    3: 'बुधवार',
    4: 'गुरुवार',
    5: 'शुक्रवार',
    6: 'शनिवार'
  };
  try {
    const d = new Date(dateStr + 'T12:00:00+05:30');
    return days[d.getDay()] || '';
  } catch {
    return '';
  }
}

/**
 * Formats YYYY-MM-DD into readable Hindi string e.g. "30 अक्टूबर 2026"
 */
export function formatDelhiDateHindi(dateStr: string): string {
  if (!dateStr) return '';
  const months: Record<string, string> = {
    '01': 'जनवरी',
    '02': 'फ़रवरी',
    '03': 'मार्च',
    '04': 'अप्रैल',
    '05': 'मई',
    '06': 'जून',
    '07': 'जुलाई',
    '08': 'अगस्त',
    '09': 'सितम्बर',
    '10': 'अक्टूबर',
    '11': 'नवम्बर',
    '12': 'दिसम्बर'
  };
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthName = months[parts[1]] || parts[1];
      const year = parts[0];
      return `${day} ${monthName} ${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Server/Online sync response type
 */
export interface OnlineDelhiTimeResponse {
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  status: 'synced' | 'fallback';
}

/**
 * Fetches true online time from server /api/time to eliminate any client clock discrepancies
 */
export async function fetchOnlineDelhiTime(): Promise<OnlineDelhiTimeResponse> {
  try {
    const res = await fetch('/api/time', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (res.ok) {
      const data = await res.json();
      return {
        date: data.date,
        time: data.time12 || data.time,
        timestamp: data.timestamp,
        timezone: data.timezone,
        status: 'synced'
      };
    }
  } catch (e) {
    console.warn('Online time API fetch failed, falling back to local IST calculation', e);
  }

  // Graceful fallback to client's IST calculation
  const now = new Date();
  return {
    date: getDelhiDateString(now),
    time: getDelhiTimeString(now),
    timestamp: now.getTime(),
    timezone: 'Asia/Kolkata',
    status: 'fallback'
  };
}
