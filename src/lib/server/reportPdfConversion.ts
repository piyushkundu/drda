import JSZip from 'jszip';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);
export const MAX_REPORT_DOCX_BYTES = 8 * 1024 * 1024;

export class ReportPdfError extends Error {
  constructor(message: string, public readonly status = 422) { super(message); }
}

/** Only inert generated DOCX packages may reach the local Office renderer. */
export async function validateReportDocx(bytes: Uint8Array) {
  if (!bytes.length || bytes.length > MAX_REPORT_DOCX_BYTES || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new ReportPdfError('मान्य Word रिपोर्ट भेजें (अधिकतम 8 MB)।', 400);
  }
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(bytes); } catch { throw new ReportPdfError('Word रिपोर्ट पढ़ी नहीं जा सकी।', 400); }
  const entries = Object.values(zip.files);
  if (entries.length > 500) throw new ReportPdfError('Word रिपोर्ट बहुत बड़ी है।', 400);
  let expandedSize = 0;
  for (const entry of entries) {
    const size = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
    expandedSize += size;
    if (expandedSize > 32 * 1024 * 1024) throw new ReportPdfError('Word रिपोर्ट बहुत बड़ी है।', 400);
    if (/vbaProject|activeX|embeddings\//i.test(entry.name) || /\.\.\//.test(entry.name)) throw new ReportPdfError('केवल साधारण रिपोर्ट DOCX समर्थित है।', 400);
    if (/\.rels$/.test(entry.name) && /TargetMode\s*=\s*["']External["']/i.test(await entry.async('string'))) {
      throw new ReportPdfError('बाहरी लिंक वाली Word फ़ाइल समर्थित नहीं है।', 400);
    }
  }
  const document = await zip.file('word/document.xml')?.async('string');
  const types = await zip.file('[Content_Types].xml')?.async('string');
  const fieldInstructions = document?.match(/<w:instrText\b[^>]*>[\s\S]*?<\/w:instrText>|<w:fldSimple\b[^>]*>/g)?.join(' ') || '';
  if (!document || !types?.includes('wordprocessingml.document.main+xml') || /macroEnabled/i.test(types) || /\b(?:DDEAUTO|DDE|INCLUDETEXT|INCLUDEPICTURE)\b/i.test(fieldInstructions)) {
    throw new ReportPdfError('यह मान्य साधारण Word रिपोर्ट नहीं है।', 400);
  }
}

// A private Word instance opens only our temporary, read-only document. Never
// attach to or terminate the user's open Office applications.
const wordScript = String.raw`param([string]$InputDocx, [string]$OutputPdf)
$ErrorActionPreference = 'Stop'
$word = $null
$document = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $word.AutomationSecurity = 3
  $document = $word.Documents.Open([System.IO.Path]::GetFullPath($InputDocx), $false, $true, $false)
  $document.ExportAsFixedFormat([System.IO.Path]::GetFullPath($OutputPdf), 17)
} finally {
  try {
    if ($null -ne $document) { $document.Close(0); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($document) }
  } finally {
    if ($null -ne $word) { $quitMode = 0; $word.Quit([ref]$quitMode); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) }
  }
}
`;

let queue: Promise<unknown> = Promise.resolve();
let pending = 0;

export async function convertReportDocxOnServer(bytes: Uint8Array): Promise<Uint8Array> {
  await validateReportDocx(bytes);
  if (process.platform !== 'win32' && !process.env.REPORT_LIBREOFFICE_PATH) {
    throw new ReportPdfError('इस सर्वर पर Word/PDF कन्वर्टर उपलब्ध नहीं है। Windows पर Microsoft Word या सर्वर पर REPORT_LIBREOFFICE_PATH आवश्यक है। Word डाउनलोड उपलब्ध है।', 503);
  }
  if (pending >= 3) throw new ReportPdfError('PDF की अन्य रिपोर्टें बन रही हैं। थोड़ी देर बाद प्रयास करें।', 429);
  pending++;
  const job = queue.then(async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'baghpat-report-'));
    const input = path.join(directory, 'report.docx');
    const output = path.join(directory, 'report.pdf');
    try {
      await writeFile(input, bytes);
      if (process.platform === 'win32') {
        const script = path.join(directory, 'convert.ps1');
        await writeFile(script, wordScript, 'utf8');
        await execute('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', script, '-InputDocx', input, '-OutputPdf', output], { windowsHide: true, timeout: 90000, maxBuffer: 256 * 1024 });
      } else {
        const profile = new URL(`file://${directory.replaceAll('\\', '/')}/profile`).href;
        await execute(process.env.REPORT_LIBREOFFICE_PATH!, [`-env:UserInstallation=${profile}`, '--headless', '--convert-to', 'pdf:writer_pdf_Export', '--outdir', directory, input], { timeout: 90000, maxBuffer: 256 * 1024 });
      }
      const pdf = await readFile(output);
      if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error('Invalid PDF output');
      return new Uint8Array(pdf);
    } catch {
      throw new ReportPdfError('Word जैसे प्रारूप में PDF नहीं बन सका। इस कंप्यूटर पर Microsoft Word उपलब्ध होना चाहिए। दोबारा प्रयास करें; Word डाउनलोड भी उपलब्ध है।', 503);
    } finally {
      // The UUID directory is created by this job and contains only its files.
      if (path.dirname(path.resolve(directory)) !== path.resolve(tmpdir()) || !path.basename(directory).startsWith('baghpat-report-')) throw new Error('Unexpected report temporary directory');
      await rm(directory, { recursive: true, force: true });
    }
  });
  queue = job.catch(() => undefined);
  try { return await job; } finally { pending--; }
}
