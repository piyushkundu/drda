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
    const pageText = document.body.innerText || '';
    
    // 1. Detect Block Name from Page Header
    let blockName = '';
    const blockMatch = pageText.match(/BLOCK\\s*:\\s*([A-Za-z]+)/i);
    if (blockMatch) {
      blockName = blockMatch[1].toUpperCase();
    }

    // 2. Locate Report Table
    const tables = Array.from(document.querySelectorAll('table'));
    let targetTable = null;
    let capturedColIdx = -1;
    let nameColIdx = -1;
    let isBlockPage = false;

    for (const t of tables) {
      const headers = Array.from(t.querySelectorAll('th, td')).map(c => c.innerText.trim());
      const hasCaptured = headers.some(h => 
        h.includes('Captured in Panchayat Nirnay') || 
        h.includes('Conducted and Captured')
      );
      if (hasCaptured) {
        targetTable = t;
        break;
      }
    }

    if (!targetTable) {
      alert('⚠️ पेज हिंदी सिंक: इस पेज पर R 9.6.2 पंचायत निर्णय ऐप की रिपोर्ट तालिका नहीं मिली। कृपया सही रिपोर्ट पेज खोलें।');
      return;
    }

    // 3. Detect column indices
    const rows = Array.from(targetTable.querySelectorAll('tr'));
    for (const r of rows) {
      const cells = Array.from(r.children);
      cells.forEach((cell, idx) => {
        const txt = cell.innerText.trim().toLowerCase();
        if (txt.includes('captured in panchayat nirnay') || txt.includes('conducted and captured')) {
          capturedColIdx = idx;
        }
        if (txt.includes('gram panchayat')) {
          nameColIdx = idx;
          isBlockPage = true;
        } else if (txt === 'block' && nameColIdx === -1) {
          nameColIdx = idx;
          isBlockPage = false;
        }
      });
      if (capturedColIdx !== -1 && nameColIdx !== -1) break;
    }

    if (capturedColIdx === -1) capturedColIdx = 7;
    if (nameColIdx === -1) nameColIdx = 1;

    // 4. Extract data
    const capturedGps = [];
    const districtStats = [];
    let totalExamined = 0;

    for (const r of rows) {
      const cells = Array.from(r.children);
      if (cells.length < 8) continue;
      const sno = parseInt(cells[0].innerText.trim(), 10);
      if (isNaN(sno)) continue;

      const name = cells[nameColIdx] ? cells[nameColIdx].innerText.trim() : '';
      const capturedVal = parseInt(cells[capturedColIdx] ? cells[capturedColIdx].innerText.trim() : '0', 10) || 0;

      totalExamined++;

      if (isBlockPage) {
        if (capturedVal > 0) {
          capturedGps.push({ sno, name, captured: true, block: blockName });
        }
      } else {
        districtStats.push({ block: name.toUpperCase(), captured: capturedVal });
      }
    }

    const payload = {
      source: 'bookmarklet',
      timestamp: new Date().toISOString(),
      isBlockPage,
      blockName,
      totalExamined,
      capturedGps,
      districtStats
    };

    // 5. Send to Page Hindi API (POST)
    const jsonStr = JSON.stringify(payload);
    let apiSuccess = false;

    fetch('http://localhost:3000/api/social-audit/sync-nirnay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonStr,
      mode: 'cors'
    }).then(res => res.json()).then(data => {
      apiSuccess = true;
      showOverlay(payload, true, data.message || 'सिंक पूर्ण हुआ!');
    }).catch(err => {
      // If direct fetch fails (e.g. Mixed content or offline), fallback to clipboard & popup
      navigator.clipboard.writeText(jsonStr).catch(() => {});
      showOverlay(payload, false, 'क्लिपबोर्ड पर कॉपी किया गया (लोकलहोस्ट पर पेस्ट करें)');
    });

    // 6. UI Overlay on government page
    function showOverlay(data, isOnline, statusMsg) {
      const old = document.getElementById('pageHindiNirnayModal');
      if (old) old.remove();

      const modal = document.createElement('div');
      modal.id = 'pageHindiNirnayModal';
      modal.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;width:380px;background:#090d16;color:#ffffff;border:2px solid #10b981;border-radius:20px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.85);font-family:sans-serif;padding:20px;animation:slideIn 0.3s ease;';

      const count = data.capturedGps ? data.capturedGps.length : 0;
      const gpList = (data.capturedGps || []).map(g => g.name).slice(0, 8).join(', ');

      modal.innerHTML = \`
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid #1e293b;padding-bottom:10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:28px;height:28px;border-radius:8px;background:#10b981;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#000;">⚡</div>
            <span style="font-weight:bold;font-size:14px;color:#34d399;">पेज हिंदी • निर्णय ऐप सिंक</span>
          </div>
          <button id="closeNirnayModalBtn" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;padding:0 4px;">&times;</button>
        </div>

        <div style="font-size:12px;margin-bottom:14px;line-height:1.5;">
          <div style="color:#a7f3d0;font-weight:bold;font-size:13px;margin-bottom:4px;">
            \${isOnline ? '✅ लाइव सिंक सफल!' : '📋 डेटा एक्सट्रैक्ट हो गया!'}
          </div>
          <div style="color:#cbd5e1;">ब्लॉक: <strong style="color:#fff;">\${data.blockName || 'जनपद समरी'}</strong></div>
          <div style="color:#cbd5e1;">सत्यापित अपलोड: <strong style="color:#34d399;font-size:14px;">\${count} ग्राम पंचायतें</strong></div>
          \${count > 0 ? \`<div style="margin-top:6px;background:#111827;padding:8px;border-radius:10px;border:1px solid #1f2937;font-size:11px;color:#93c5fd;max-height:80px;overflow-y:auto;">\${gpList}\${count > 8 ? '... आदि' : ''}</div>\` : ''}
        </div>

        <div style="display:flex;gap:8px;">
          <a href="http://localhost:3000/?nirnaySync=\${encodeURIComponent(jsonStr)}" target="_blank" style="flex:1;background:#2563eb;color:#fff;text-align:center;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:bold;text-decoration:none;display:block;">
            पेज हिंदी में देखें →
          </a>
          <button id="copyJsonBtn" style="background:#1e293b;border:1px solid #334155;color:#f1f5f9;padding:8px 12px;border-radius:10px;font-size:11px;cursor:pointer;font-weight:bold;">
            डेटा कॉपी
          </button>
        </div>
      \`;

      document.body.appendChild(modal);

      document.getElementById('closeNirnayModalBtn').onclick = () => modal.remove();
      document.getElementById('copyJsonBtn').onclick = function() {
        navigator.clipboard.writeText(jsonStr);
        this.innerText = 'कॉपी हो गया!';
        setTimeout(() => { this.innerText = 'डेटा कॉपी'; }, 2000);
      };

      setTimeout(() => {
        if (modal && modal.parentNode) modal.style.opacity = '0.95';
      }, 8000);
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
  const code = getBookmarkletScript()
    .replace(/\s+/g, ' ')
    .trim();
  return `javascript:${encodeURIComponent(code)}`;
}
