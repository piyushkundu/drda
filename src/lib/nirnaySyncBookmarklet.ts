/**
 * Panchayat Nirnay App (R 9.6.2) - 1-Click Bookmarklet & Live Sync Utility
 * 
 * Allows users to fetch/extract live data from the official MNREGA portal
 * (mnregaweb4.nic.in / dord.gov.in) with a single click in their browser.
 */

import { SocialAuditRecord } from '@/types/socialAudit';

export interface NirnaySyncPayload {
  source: string;
  timestamp: string;
  isBlockPage?: boolean;
  blockName?: string; // 'BAGHPAT' | 'BARAUT' etc.
  totalExamined?: number;
  capturedGps?: Array<{ sno?: number; name?: string; captured?: boolean; block?: string }>;
  districtStats?: Array<{ block: string; captured: number; mapped?: number; total?: number }>;
}

/**
 * Applies a received Nirnay sync payload to existing social audit records
 */
export function applyNirnaySyncPayload(
  payload: NirnaySyncPayload,
  records: SocialAuditRecord[]
): {
  updatedCount: number;
  updatedNames: string[];
  blockMatched: string;
} {
  const updatedNames: string[] = [];
  const normalizedBlock = (payload.blockName || '').toUpperCase();

  // If payload contains explicit GP list from a block page
  if (payload.capturedGps && payload.capturedGps.length > 0) {
    const capturedSetBySno = new Set(payload.capturedGps.map(g => g.sno).filter(Boolean));
    const capturedSetByName = new Set(payload.capturedGps.map(g => (g.name || '').toUpperCase().replace(/[^A-Z]/g, '')));

    records.forEach(r => {
      // Check if block matches
      const rBlock = r.block.toUpperCase();
      const isTargetBlock = !normalizedBlock || rBlock === normalizedBlock || 
        (normalizedBlock.includes('BAGHPAT') && rBlock === 'BAGHPAT') ||
        (normalizedBlock.includes('BARAUT') && rBlock === 'BARAUT');

      if (!isTargetBlock) return;

      const snoMatch = r.sno && capturedSetBySno.has(r.sno);
      const nameNorm = (r.gpNameUnicode || '').toUpperCase().replace(/[^A-Z]/g, '');
      const nameMatch = nameNorm && capturedSetByName.has(nameNorm);

      if (snoMatch || nameMatch) {
        if (r.panchayatNirnayStatus !== 'captured') {
          r.panchayatNirnayStatus = 'captured';
          r.panchayatNirnayCapturedDate = r.panchayatNirnayCapturedDate || r.meetingDate;
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
export function getBookmarkletScript(): string {
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
    var capturedColIdx = -1;
    var nameColIdx = -1;
    var isBlockPage = false;

    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      var headers = Array.from(t.querySelectorAll('th, td')).map(function(c) { return c.innerText.trim(); });
      var hasCaptured = headers.some(function(h) {
        return h.indexOf('Captured in Panchayat Nirnay') !== -1 || h.indexOf('Conducted and Captured') !== -1;
      });
      if (hasCaptured) {
        targetTable = t;
        break;
      }
    }

    if (!targetTable) {
      alert('पेज हिंदी सिंक: इस पेज पर R 9.6.2 पंचायत निर्णय ऐप की रिपोर्ट तालिका नहीं मिली। कृपया सही रिपोर्ट पेज खोलें।');
      return;
    }

    var rows = Array.from(targetTable.querySelectorAll('tr'));
    for (var rIdx = 0; rIdx < rows.length; rIdx++) {
      var r = rows[rIdx];
      var cells = Array.from(r.children);
      for (var cIdx = 0; cIdx < cells.length; cIdx++) {
        var txt = cells[cIdx].innerText.trim().toLowerCase();
        if (txt.indexOf('captured in panchayat nirnay') !== -1 || txt.indexOf('conducted and captured') !== -1) {
          capturedColIdx = cIdx;
        }
        if (txt.indexOf('gram panchayat') !== -1) {
          nameColIdx = cIdx;
          isBlockPage = true;
        } else if (txt === 'block' && nameColIdx === -1) {
          nameColIdx = cIdx;
          isBlockPage = false;
        }
      }
      if (capturedColIdx !== -1 && nameColIdx !== -1) break;
    }

    if (capturedColIdx === -1) capturedColIdx = 7;
    if (nameColIdx === -1) nameColIdx = 1;

    var capturedGps = [];
    var districtStats = [];
    var totalExamined = 0;

    for (var rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      var rowEl = rows[rowIdx];
      var rowCells = Array.from(rowEl.children);
      if (rowCells.length < 8) continue;
      var sno = parseInt(rowCells[0].innerText.trim(), 10);
      if (isNaN(sno)) continue;

      var name = rowCells[nameColIdx] ? rowCells[nameColIdx].innerText.trim() : '';
      var capturedVal = parseInt(rowCells[capturedColIdx] ? rowCells[capturedColIdx].innerText.trim() : '0', 10) || 0;

      totalExamined++;

      if (isBlockPage) {
        if (capturedVal > 0) {
          capturedGps.push({ sno: sno, name: name, captured: true, block: blockName });
        }
      } else {
        districtStats.push({ block: name.toUpperCase(), captured: capturedVal });
      }
    }

    var payload = {
      source: 'bookmarklet',
      timestamp: new Date().toISOString(),
      isBlockPage: isBlockPage,
      blockName: blockName,
      totalExamined: totalExamined,
      capturedGps: capturedGps,
      districtStats: districtStats
    };

    var jsonStr = JSON.stringify(payload);

    fetch('http://localhost:3000/api/social-audit/sync-nirnay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonStr,
      mode: 'cors'
    }).then(function(res) {
      return res.json();
    }).then(function(data) {
      showOverlay(payload, true, data.message || 'सिंक पूर्ण हुआ!');
    }).catch(function() {
      try { navigator.clipboard.writeText(jsonStr); } catch(e) {}
      showOverlay(payload, false, 'क्लिपबोर्ड पर कॉपी किया गया');
    });

    function showOverlay(data, isOnline, statusMsg) {
      var old = document.getElementById('pageHindiNirnayModal');
      if (old) old.remove();

      var modal = document.createElement('div');
      modal.id = 'pageHindiNirnayModal';
      modal.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;width:380px;background:#090d16;color:#ffffff;border:2px solid #10b981;border-radius:20px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.85);font-family:sans-serif;padding:20px;';

      var count = data.capturedGps ? data.capturedGps.length : 0;
      var gpList = (data.capturedGps || []).map(function(g) { return g.name; }).slice(0, 8).join(', ');

      var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid #1e293b;padding-bottom:10px;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<div style="width:28px;height:28px;border-radius:8px;background:#10b981;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#000;">⚡</div>' +
          '<span style="font-weight:bold;font-size:14px;color:#34d399;">पेज हिंदी • निर्णय ऐप सिंक</span>' +
        '</div>' +
        '<button id="closeNirnayModalBtn" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;padding:0 4px;">&times;</button>' +
      '</div>' +
      '<div style="font-size:12px;margin-bottom:14px;line-height:1.5;">' +
        '<div style="color:#a7f3d0;font-weight:bold;font-size:13px;margin-bottom:4px;">' + (isOnline ? '✅ लाइव सिंक सफल!' : '📋 डेटा एक्सट्रैक्ट हो गया!') + '</div>' +
        '<div style="color:#cbd5e1;">ब्लॉक: <strong style="color:#fff;">' + (data.blockName || 'जनपद समरी') + '</strong></div>' +
        '<div style="color:#cbd5e1;">सत्यापित अपलोड: <strong style="color:#34d399;font-size:14px;">' + count + ' ग्राम पंचायतें</strong></div>' +
        (count > 0 ? '<div style="margin-top:6px;background:#111827;padding:8px;border-radius:10px;border:1px solid #1f2937;font-size:11px;color:#93c5fd;max-height:80px;overflow-y:auto;">' + gpList + (count > 8 ? '... आदि' : '') + '</div>' : '') +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<a href="http://localhost:3000/?nirnaySync=' + encodeURIComponent(jsonStr) + '" target="_blank" style="flex:1;background:#2563eb;color:#fff;text-align:center;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:bold;text-decoration:none;display:block;">पेज हिंदी में देखें →</a>' +
        '<button id="copyJsonBtn" style="background:#1e293b;border:1px solid #334155;color:#f1f5f9;padding:8px 12px;border-radius:10px;font-size:11px;cursor:pointer;font-weight:bold;">डेटा कॉपी</button>' +
      '</div>';

      modal.innerHTML = html;
      document.body.appendChild(modal);

      document.getElementById('closeNirnayModalBtn').onclick = function() { modal.remove(); };
      document.getElementById('copyJsonBtn').onclick = function() {
        try { navigator.clipboard.writeText(jsonStr); } catch(e) {}
        this.innerText = 'कॉपी हो गया!';
        var btn = this;
        setTimeout(function() { btn.innerText = 'डेटा कॉपी'; }, 2000);
      };
    }

  } catch(e) {
    alert('पेज हिंदी सिंक त्रुटि: ' + e.message);
  }
})();`;
}

/**
 * Returns formatted bookmarklet href for drag-and-drop <a> tag
 */
export function getBookmarkletHref(): string {
  var code = getBookmarkletScript();
  var minified = code
    .split('\n')
    .map(function(line) { return line.trim(); })
    .filter(Boolean)
    .join(' ');
  return 'javascript:' + encodeURIComponent(minified);
}
