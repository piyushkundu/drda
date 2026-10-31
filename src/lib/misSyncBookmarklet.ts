/**
 * R 9.1.3 Social Audit Calendar Vs Audits Completed - 1-Click Bookmarklet & Live Sync Utility
 * 
 * Allows users to fetch/extract live MIS audit feeding data from the official MNREGA portal
 * (mnregaweb1.dord.gov.in / mnregaweb4.nic.in / dord.gov.in) with a single click.
 */

import { SocialAuditRecord } from '@/types/socialAudit';

export interface MisSyncPayload {
  source: string;
  timestamp: string;
  isBlockPage?: boolean;
  blockName?: string; // 'BAGHPAT' | 'BARAUT' etc.
  totalExamined?: number;
  auditedGps?: Array<{ sno?: number; name?: string; audited?: boolean; block?: string; auditedCount?: number }>;
  districtStats?: Array<{ block: string; audited: number; planned?: number; total?: number; percentage?: string }>;
}

/**
 * Applies a received MIS sync payload to existing social audit records
 */
export function applyMisSyncPayload(
  payload: MisSyncPayload,
  records: SocialAuditRecord[]
): {
  updatedCount: number;
  updatedNames: string[];
  blockMatched: string;
} {
  const updatedNames: string[] = [];
  const normalizedBlock = (payload.blockName || '').toUpperCase();

  if (payload.auditedGps && payload.auditedGps.length > 0) {
    const auditedSetBySno = new Set(payload.auditedGps.map(g => g.sno).filter(Boolean));
    const auditedSetByName = new Set(payload.auditedGps.map(g => (g.name || '').toUpperCase().replace(/[^A-Z]/g, '')));

    records.forEach(r => {
      const rBlock = r.block.toUpperCase();
      const isTargetBlock = !normalizedBlock || rBlock === normalizedBlock || 
        (normalizedBlock.includes('BAGHPAT') && rBlock === 'BAGHPAT') ||
        (normalizedBlock.includes('BARAUT') && rBlock === 'BARAUT');

      if (!isTargetBlock) return;

      const snoMatch = r.sno && auditedSetBySno.has(r.sno);
      const nameNorm = (r.gpNameUnicode || '').toUpperCase().replace(/[^A-Z]/g, '');
      const nameMatch = nameNorm && auditedSetByName.has(nameNorm);

      if (snoMatch || nameMatch) {
        if (r.misStatus !== 'fed') {
          r.misStatus = 'fed';
          r.misAuditedCount = 1;
          r.misFedDate = r.misFedDate || r.meetingDate;
          updatedNames.push(r.gpNameUnicode);
        }
      }
    });
  }

  return {
    updatedCount: updatedNames.length,
    updatedNames,
    blockMatched: payload.blockName || 'जनपद बागपत'
  };
}

/**
 * Raw JavaScript snippet that executes in the user's browser when clicking the bookmarklet
 */
export function getMisBookmarkletScript(): string {
  return `(function() {
  try {
    var pageText = document.body.innerText || '';
    var blockName = '';
    var blockMatch = pageText.match(/BLOCK\\s*:\\s*([A-Za-z]+)/i);
    if (blockMatch) {
      blockName = blockMatch[1].toUpperCase();
    }

    var tables = Array.from(document.querySelectorAll('table'));
    var targetTable = null;
    var auditedColIdx = -1;
    var nameColIdx = -1;
    var isBlockPage = false;

    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      var headers = Array.from(t.querySelectorAll('th, td')).map(function(c) { return c.innerText.trim(); });
      var hasAudited = headers.some(function(h) {
        return h.indexOf('audited atleast once') !== -1 || 
               h.indexOf('Audited GPs') !== -1 || 
               h.indexOf('audited once in FY') !== -1 ||
               h.indexOf('Social Audit Calendar Vs Audits Completed') !== -1;
      });
      if (hasAudited) {
        targetTable = t;
        break;
      }
    }

    if (!targetTable) {
      alert('पेज हिंदी सिंक: इस पेज पर R 9.1.3 Social Audit Calendar Vs Audits Completed रिपोर्ट तालिका नहीं मिली। कृपया सही रिपोर्ट पेज खोलें।');
      return;
    }

    var rows = Array.from(targetTable.querySelectorAll('tr'));
    for (var rIdx = 0; rIdx < rows.length; rIdx++) {
      var r = rows[rIdx];
      var cells = Array.from(r.children);
      for (var cIdx = 0; cIdx < cells.length; cIdx++) {
        var txt = cells[cIdx].innerText.trim().toLowerCase();
        if (txt.indexOf('audited atleast once in fy') !== -1 || 
            txt.indexOf('total number of gps audited') !== -1 ||
            txt.indexOf('column 10+11') !== -1) {
          auditedColIdx = cIdx;
        }
        if (txt.indexOf('gram panchayat') !== -1) {
          nameColIdx = cIdx;
          isBlockPage = true;
        } else if (txt === 'block' && nameColIdx === -1) {
          nameColIdx = cIdx;
          isBlockPage = false;
        }
      }
      if (auditedColIdx !== -1 && nameColIdx !== -1) break;
    }

    if (auditedColIdx === -1) auditedColIdx = 7;
    if (nameColIdx === -1) nameColIdx = 1;

    var auditedGps = [];
    var districtStats = [];
    var totalExamined = 0;

    for (var rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      var rowEl = rows[rowIdx];
      var rowCells = Array.from(rowEl.children);
      if (rowCells.length < 8) continue;
      var sno = parseInt(rowCells[0].innerText.trim(), 10);
      if (isNaN(sno)) continue;

      var name = rowCells[nameColIdx] ? rowCells[nameColIdx].innerText.trim() : '';
      var auditedVal = parseInt(rowCells[auditedColIdx] ? rowCells[auditedColIdx].innerText.trim() : '0', 10) || 0;

      totalExamined++;

      if (isBlockPage) {
        if (auditedVal > 0) {
          auditedGps.push({ sno: sno, name: name, audited: true, block: blockName, auditedCount: auditedVal });
        }
      } else {
        districtStats.push({ block: name.toUpperCase(), audited: auditedVal });
      }
    }

    var payload = {
      source: 'bookmarklet_r913',
      timestamp: new Date().toISOString(),
      isBlockPage: isBlockPage,
      blockName: blockName,
      totalExamined: totalExamined,
      auditedGps: auditedGps,
      districtStats: districtStats
    };

    var jsonStr = JSON.stringify(payload);

    fetch('http://localhost:3000/api/social-audit/sync-mis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonStr,
      mode: 'cors'
    }).then(function(res) {
      return res.json();
    }).then(function(data) {
      showOverlay(payload, true, data.message || 'MIS सिंक पूर्ण हुआ!');
    }).catch(function() {
      try { navigator.clipboard.writeText(jsonStr); } catch(e) {}
      showOverlay(payload, false, 'क्लिपबोर्ड पर कॉपी किया गया (लोकलहोस्ट पर पेस्ट करें)');
    });

    function showOverlay(data, isOnline, statusMsg) {
      var old = document.getElementById('pageHindiMisModal');
      if (old) old.remove();

      var modal = document.createElement('div');
      modal.id = 'pageHindiMisModal';
      modal.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;width:380px;background:#090d16;color:#ffffff;border:2px solid #3b82f6;border-radius:20px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.85);font-family:sans-serif;padding:20px;';

      var count = data.auditedGps ? data.auditedGps.length : 0;
      var gpList = (data.auditedGps || []).map(function(g) { return g.name; }).slice(0, 8).join(', ');

      var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid #1e293b;padding-bottom:10px;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<div style="width:28px;height:28px;border-radius:8px;background:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff;">⚡</div>' +
          '<span style="font-weight:bold;font-size:14px;color:#60a5fa;">पेज हिंदी • MIS फीडिंग सिंक</span>' +
        '</div>' +
        '<button id="closeMisModalBtn" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;padding:0 4px;">&times;</button>' +
      '</div>' +
      '<div style="font-size:12px;margin-bottom:14px;line-height:1.5;">' +
        '<div style="color:#93c5fd;font-weight:bold;font-size:13px;margin-bottom:4px;">' + (isOnline ? '✅ लाइव सिंक सफल!' : '📋 डेटा एक्सट्रैक्ट हो गया!') + '</div>' +
        '<div style="color:#cbd5e1;">ब्लॉक: <strong style="color:#fff;">' + (data.blockName || 'जनपद समरी') + '</strong></div>' +
        '<div style="color:#cbd5e1;">MIS पर फीडेड (पूर्ण): <strong style="color:#38bdf8;font-size:14px;">' + count + ' ग्राम पंचायतें</strong></div>' +
        (count > 0 ? '<div style="margin-top:6px;background:#111827;padding:8px;border-radius:10px;border:1px solid #1f2937;font-size:11px;color:#93c5fd;max-height:80px;overflow-y:auto;">' + gpList + (count > 8 ? '... आदि' : '') + '</div>' : '') +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<a href="http://localhost:3000" target="_blank" style="flex:1;background:#2563eb;color:#fff;text-align:center;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:bold;text-decoration:none;display:block;">पेज हिंदी में देखें →</a>' +
        '<button id="copyMisJsonBtn" style="background:#1e293b;border:1px solid #334155;color:#f1f5f9;padding:8px 12px;border-radius:10px;font-size:11px;cursor:pointer;font-weight:bold;">डेटा कॉपी</button>' +
      '</div>';

      modal.innerHTML = html;
      document.body.appendChild(modal);

      document.getElementById('closeMisModalBtn').onclick = function() { modal.remove(); };
      document.getElementById('copyMisJsonBtn').onclick = function() {
        try { navigator.clipboard.writeText(jsonStr); } catch(e) {}
        this.innerText = 'कॉपी हो गया!';
        var btn = this;
        setTimeout(function() { btn.innerText = 'डेटा कॉपी'; }, 2000);
      };
    }

  } catch(e) {
    alert('पेज हिंदी MIS सिंक त्रुटि: ' + e.message);
  }
})();`;
}

/**
 * Returns formatted bookmarklet href for drag-and-drop <a> tag
 */
export function getMisBookmarkletHref(): string {
  var code = getMisBookmarkletScript();
  var minified = code
    .split('\n')
    .map(function(line) { return line.trim(); })
    .filter(Boolean)
    .join(' ');
  return 'javascript:' + encodeURIComponent(minified);
}
