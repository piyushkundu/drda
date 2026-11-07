/* eslint-disable @typescript-eslint/no-require-imports -- Isolated TS loader; no database imports. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, parent, ...rest) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : name, parent, ...rest);
};
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
}).outputText, filename);
const JSZip = require('jszip');
const server = require('../src/lib/server/reportPdfConversion.ts');
const { POST } = require('../src/app/api/social-audit/reports/pdf/route.ts');
const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const nativeFetch = global.fetch;
let count = 0;
const check = async (name, run) => { await run(); count++; console.log(`PASS ${name}`); };
async function main() {
  const template = fs.readFileSync(path.join(root, 'public/templates/social-audit-mpr-2026.docx'));
  const request = (bytes, headers = {}) => new Request('http://localhost:3000/api/social-audit/reports/pdf', { method: 'POST', headers: { 'content-type': mime, ...headers }, body: bytes });
  await check('Official report template passes inert DOCX validation', () => server.validateReportDocx(template));
  await check('Non-DOCX, empty, oversize and corrupt ZIP input is rejected before Office starts', async () => {
    for (const bytes of [new Uint8Array(), Buffer.from('not a DOCX'), new Uint8Array(server.MAX_REPORT_DOCX_BYTES + 1), Buffer.from('PKnot-a-zip')]) {
      await assert.rejects(server.validateReportDocx(bytes), error => error.status === 400);
    }
  });
  await check('External targets and embedded active content are rejected', async () => {
    for (const [name, content] of [['word/_rels/test.rels', '<Relationship TargetMode="External" Target="file:///C:/test"/>'], ['word/embeddings/oleObject1.bin', 'test'], ['word/vbaProject.bin', 'test']]) {
      const zip = await JSZip.loadAsync(template); zip.file(name, content);
      await assert.rejects(server.validateReportDocx(await zip.generateAsync({ type: 'uint8array' })), error => error.status === 400);
    }
    const zip = await JSZip.loadAsync(template);
    const xml = await zip.file('word/document.xml').async('string');
    zip.file('word/document.xml', xml.replace('<w:body>', '<w:body><w:p><w:r><w:instrText>DDEAUTO unsafe command</w:instrText></w:r></w:p>'));
    await assert.rejects(server.validateReportDocx(await zip.generateAsync({ type: 'uint8array' })), error => error.status === 400);
    zip.file('word/document.xml', xml.replace('<w:body>', '<w:body><w:p><w:r><w:t>DDE-123 ordinary registration ID</w:t></w:r></w:p>'));
    await server.validateReportDocx(await zip.generateAsync({ type: 'uint8array' }));
  });
  await check('Cross-site PDF requests are rejected; wrong type and oversize have clear status codes', async () => {
    assert.equal((await POST(request(template, { origin: 'https://unrelated.example' }))).status, 403);
    assert.equal((await POST(request(template, { 'sec-fetch-site': 'cross-site' }))).status, 403);
    assert.equal((await POST(request(template, { 'content-type': 'text/plain' }))).status, 415);
    assert.equal((await POST(request(template, { 'content-length': String(server.MAX_REPORT_DOCX_BYTES + 1) }))).status, 413);
    assert.equal((await POST(request(new Uint8Array(server.MAX_REPORT_DOCX_BYTES + 1)))).status, 413);
  });
  await check('Malformed Word returns a user-facing error without starting conversion', async () => {
    const response = await POST(request(Buffer.from('bad')));
    assert.equal(response.status, 400); assert.ok((await response.json()).error);
  });
  await check('Client reports conversion failures and rejects an incomplete PDF', async () => {
    const { convertReportDocxToPdf } = require('../src/lib/reportPdfClient.ts');
    global.fetch = async () => ({ ok: false, json: async () => ({ error: 'Converter unavailable' }) });
    await assert.rejects(convertReportDocxToPdf(template), /Converter unavailable/);
    global.fetch = async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });
    await assert.rejects(convertReportDocxToPdf(template), /PDF/);
  });
  await check('A failed PDF retries conversion with the same cached Word file', async () => {
    const { createReportFiles } = require('../src/lib/reportPdfClient.ts');
    let wordBuilds = 0;
    global.fetch = async (url, options) => {
      assert.deepEqual(Buffer.from(options.body), template);
      return { ok: false, json: async () => ({ error: 'Temporary conversion error' }) };
    };
    const files = createReportFiles(async () => { wordBuilds++; return template; });
    await assert.rejects(files.getPdf(), /Temporary conversion error/);
    const pdfBytes = Buffer.from('%PDF-1.7');
    global.fetch = async () => ({ ok: true, arrayBuffer: async () => pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) });
    assert.equal(Buffer.from(await files.getPdf()).toString(), '%PDF-1.7');
    assert.equal(wordBuilds, 1);
  });
  if (process.argv.includes('--native')) {
    // QA fixtures contain invented values. They never touch master data or cloud.
    for (const name of ['sample-edited-monthly', 'sample-brp']) {
      await check(`Native Word exports ${name} through the real API handler`, async () => {
        const source = path.join(root, 'scratch/mpr-report-review', `${name}.docx`);
        const bytes = fs.readFileSync(source);
        const response = await POST(request(bytes, { origin: 'http://localhost:3000' }));
        assert.equal(response.status, 200, response.status !== 200 ? await response.text() : undefined);
        assert.equal(response.headers.get('content-type'), 'application/pdf');
        assert.equal(response.headers.get('cache-control'), 'no-store');
        const pdf = Buffer.from(await response.arrayBuffer());
        assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
        fs.writeFileSync(path.join(root, 'scratch/mpr-report-review', `${name}-canonical.pdf`), pdf);
        assert.deepEqual(fs.readFileSync(source), bytes, 'conversion leaves original Word bytes untouched');
      });
    }
  }
  const httpOrigin = process.argv.find(arg => arg.startsWith('--http-origin='))?.slice('--http-origin='.length);
  if (httpOrigin) {
    await check('Running Next server exposes all 17 report pages and rejects an unknown report URL', async () => {
      const { REPORT_CATALOG } = require('../src/lib/socialAuditReports.ts');
      for (const item of REPORT_CATALOG) assert.equal((await nativeFetch(`${httpOrigin}/social-audit/reports/${item.id}`)).status, 200, item.id);
      assert.equal((await nativeFetch(`${httpOrigin}/social-audit/reports`)).status, 200);
      assert.equal((await nativeFetch(`${httpOrigin}/social-audit/reports/unknown-report`)).status, 404);
    });
    await check('Running Next API converts canonical Word bytes and returns downloadable PDF', async () => {
      const bytes = fs.readFileSync(path.join(root, 'scratch/mpr-report-review/sample-edited-monthly.docx'));
      const response = await nativeFetch(`${httpOrigin}/api/social-audit/reports/pdf`, { method: 'POST', headers: { 'content-type': mime, origin: httpOrigin }, body: bytes });
      assert.equal(response.status, 200, response.status !== 200 ? await response.text() : undefined);
      assert.equal(response.headers.get('content-type'), 'application/pdf');
      assert.match(response.headers.get('content-disposition'), /attachment/);
      assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
    });
  }
  console.log(`\n${count} PDF conversion checks passed. No database reads or writes.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
