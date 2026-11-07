/** Render the canonical Word file; never substitute a second report layout. */
export async function convertReportDocxToPdf(docx: Uint8Array): Promise<Uint8Array> {
  const response = await fetch('/api/social-audit/reports/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    body: new Uint8Array(docx).buffer,
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error || 'Word जैसे प्रारूप में PDF नहीं बना। दोबारा प्रयास करें।');
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (String.fromCharCode(...bytes.subarray(0, 5)) !== '%PDF-') throw new Error('PDF फ़ाइल अधूरी मिली। दोबारा प्रयास करें।');
  return bytes;
}

/** Cache files by the immutable input snapshot; failed requests can be retried. */
export function createReportFiles(buildWord: () => Promise<Uint8Array>) {
  let word: Promise<Uint8Array> | undefined;
  let pdf: Promise<Uint8Array> | undefined;
  const getWord = () => {
    if (!word) word = buildWord().catch(error => { word = undefined; throw error; });
    return word;
  };
  const getPdf = () => {
    if (!pdf) pdf = getWord().then(convertReportDocxToPdf).catch(error => { pdf = undefined; throw error; });
    return pdf;
  };
  return { getWord, getPdf };
}
