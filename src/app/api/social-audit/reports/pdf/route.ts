import { convertReportDocxOnServer, MAX_REPORT_DOCX_BYTES, ReportPdfError } from '@/lib/server/reportPdfConversion';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return Response.json({ error: 'इसी पोर्टल से रिपोर्ट डाउनलोड करें।' }, { status: 403 });
  }
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return Response.json({ error: 'केवल DOCX रिपोर्ट समर्थित है।' }, { status: 415 });
  }
  if (Number(request.headers.get('content-length')) > MAX_REPORT_DOCX_BYTES) {
    return Response.json({ error: 'रिपोर्ट अधिकतम 8 MB हो सकती है।' }, { status: 413 });
  }
  try {
    // Bound streaming reads as well: Content-Length may be omitted or incorrect.
    const reader = request.body?.getReader();
    if (!reader) throw new ReportPdfError('रिपोर्ट फ़ाइल नहीं मिली।', 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_REPORT_DOCX_BYTES) { await reader.cancel(); throw new ReportPdfError('रिपोर्ट अधिकतम 8 MB हो सकती है।', 413); }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const pdf = await convertReportDocxOnServer(bytes);
    return new Response(new Uint8Array(pdf).buffer, { headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Baghpat_Report.pdf"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch (error) {
    return Response.json({ error: error instanceof ReportPdfError ? error.message : 'PDF तैयार नहीं हुआ। दोबारा प्रयास करें।' }, { status: error instanceof ReportPdfError ? error.status : 500 });
  }
}
