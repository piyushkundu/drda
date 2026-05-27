import JSZip from 'jszip';

// ─── Unit Conversions ──────────────────────────────────────────────────────
// Word uses twips (1/20 of a point, 1440 per inch) for spacing/margins
// and half-points for font sizes. We convert to CSS-native units.
const twipToPx = (twip: number) => Math.round(twip / 15);   // 1440 twips/in ÷ 96 px/in ≈ 15
const hpToPt   = (hp: number) => hp / 2;                     // half-points → points
const emuToPx  = (emu: number) => Math.round(emu / 9525);    // EMUs → px

// ─── XML helpers (namespace-agnostic) ──────────────────────────────────────
const child = (node: Element, ...names: string[]): Element | undefined => {
  let cur: Element | undefined = node;
  for (const name of names) {
    if (!cur) return undefined;
    cur = Array.from(cur.children).find(n => {
      const local = n.localName || n.nodeName.split(':').pop() || '';
      return local === name;
    });
  }
  return cur;
};

const children = (node: Element, name: string): Element[] =>
  Array.from(node.children).filter(n => {
    const local = n.localName || n.nodeName.split(':').pop() || '';
    return local === name;
  });

const attr = (node: Element | undefined, name: string): string | null => {
  if (!node) return null;
  // Try w:val, w:name, val, then the direct attribute
  return node.getAttribute(`w:${name}`) || node.getAttribute(name) || null;
};

// ─── Style Definitions ────────────────────────────────────────────────────
interface ParaStyle {
  align?: string;
  lineHeight?: string;
  marginTop?: number;
  marginBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  textIndent?: number;
  fontFamily?: string;
  fontSize?: number;  // half-points
  bold?: boolean;
  italic?: boolean;
  color?: string;
}

function parseStyles(stylesXml: string): Map<string, ParaStyle> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(stylesXml, 'text/xml');
  const styles = new Map<string, ParaStyle>();

  // Parse document defaults first
  const docDefaults = child(doc.documentElement, 'docDefaults');
  const defaultRPr = child(docDefaults!, 'rPrDefault', 'rPr');
  const defaultPPr = child(docDefaults!, 'pPrDefault', 'pPr');

  const defaultStyle: ParaStyle = {};
  if (defaultRPr) {
    const sz = attr(child(defaultRPr, 'sz'), 'val');
    if (sz) defaultStyle.fontSize = parseInt(sz, 10);
    const fonts = child(defaultRPr, 'rFonts');
    if (fonts) {
      defaultStyle.fontFamily = attr(fonts, 'ascii') || attr(fonts, 'hAnsi') || attr(fonts, 'cs') || undefined;
    }
  }
  if (defaultPPr) {
    const spacing = child(defaultPPr, 'spacing');
    if (spacing) {
      const after = attr(spacing, 'after');
      if (after) defaultStyle.marginBottom = twipToPx(parseInt(after, 10));
      const before = attr(spacing, 'before');
      if (before) defaultStyle.marginTop = twipToPx(parseInt(before, 10));
      const line = attr(spacing, 'line');
      if (line) defaultStyle.lineHeight = (parseInt(line, 10) / 240).toFixed(2);
    }
  }
  styles.set('__default__', defaultStyle);

  // Parse named styles
  for (const style of children(doc.documentElement, 'style')) {
    const styleId = attr(style, 'styleId');
    if (!styleId) continue;

    const ps: ParaStyle = { ...defaultStyle };

    // Inherit from basedOn style
    const basedOn = attr(child(style, 'basedOn'), 'val');
    if (basedOn && styles.has(basedOn)) {
      Object.assign(ps, styles.get(basedOn));
    }

    // Paragraph properties
    const pPr = child(style, 'pPr');
    if (pPr) {
      const jc = attr(child(pPr, 'jc'), 'val');
      if (jc) ps.align = jc === 'both' ? 'justify' : jc;

      const spacing = child(pPr, 'spacing');
      if (spacing) {
        const line = attr(spacing, 'line');
        if (line) ps.lineHeight = (parseInt(line, 10) / 240).toFixed(2);
        const after = attr(spacing, 'after');
        if (after) ps.marginBottom = twipToPx(parseInt(after, 10));
        const before = attr(spacing, 'before');
        if (before) ps.marginTop = twipToPx(parseInt(before, 10));
      }

      const ind = child(pPr, 'ind');
      if (ind) {
        const left = attr(ind, 'left');
        if (left) ps.paddingLeft = twipToPx(parseInt(left, 10));
        const right = attr(ind, 'right');
        if (right) ps.paddingRight = twipToPx(parseInt(right, 10));
        const firstLine = attr(ind, 'firstLine');
        const hanging = attr(ind, 'hanging');
        if (firstLine) ps.textIndent = twipToPx(parseInt(firstLine, 10));
        else if (hanging) ps.textIndent = -twipToPx(parseInt(hanging, 10));
      }
    }

    // Run properties (character formatting)
    const rPr = child(style, 'rPr');
    if (rPr) {
      const sz = attr(child(rPr, 'sz'), 'val');
      if (sz) ps.fontSize = parseInt(sz, 10);
      if (child(rPr, 'b')) ps.bold = attr(child(rPr, 'b'), 'val') !== '0';
      if (child(rPr, 'i')) ps.italic = attr(child(rPr, 'i'), 'val') !== '0';
      const color = attr(child(rPr, 'color'), 'val');
      if (color && color !== 'auto') ps.color = color;
      const fonts = child(rPr, 'rFonts');
      if (fonts) {
        ps.fontFamily = attr(fonts, 'ascii') || attr(fonts, 'hAnsi') || attr(fonts, 'cs') || ps.fontFamily;
      }
    }

    styles.set(styleId, ps);
  }

  return styles;
}

// ─── Main Parser ──────────────────────────────────────────────────────────
export async function parseDocxToHtml(arrayBuffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(arrayBuffer);

  const docXml = await zip.file('word/document.xml')?.async('string');
  if (!docXml) return '';

  // Load styles
  const stylesXml = await zip.file('word/styles.xml')?.async('string');
  const styleMap = stylesXml ? parseStyles(stylesXml) : new Map<string, ParaStyle>();
  const defaultStyle = styleMap.get('__default__') || {};

  // Load images (for inline images)
  const relsXml = await zip.file('word/_rels/document.xml.rels')?.async('string');
  const imageRels = new Map<string, string>();
  if (relsXml) {
    const relsParser = new DOMParser();
    const relsDoc = relsParser.parseFromString(relsXml, 'text/xml');
    for (const rel of Array.from(relsDoc.getElementsByTagName('Relationship'))) {
      const id = rel.getAttribute('Id');
      const target = rel.getAttribute('Target');
      const type = rel.getAttribute('Type') || '';
      if (id && target && type.includes('image')) {
        imageRels.set(id, target.replace(/^\/?/, ''));
      }
    }
  }

  const parser = new DOMParser();
  const xml = parser.parseFromString(docXml, 'text/xml');

  // Find the <w:body> element
  let body: Element | undefined;
  for (const el of Array.from(xml.documentElement.children)) {
    const local = el.localName || el.nodeName.split(':').pop() || '';
    if (local === 'body') { body = el; break; }
  }
  if (!body) body = xml.documentElement;

  // ── Process Paragraph ──────────────────────────────────────────────
  function processParagraph(pNode: Element): string {
    const pPr = child(pNode, 'pPr');

    // Get base style from style reference
    const pStyleId = attr(child(pPr!, 'pStyle'), 'val');
    const baseStyle: ParaStyle = pStyleId && styleMap.has(pStyleId)
      ? { ...defaultStyle, ...styleMap.get(pStyleId) }
      : { ...defaultStyle };

    // Build paragraph CSS
    const css: string[] = [];

    // Alignment (override from direct formatting)
    const jc = attr(child(pPr!, 'jc'), 'val');
    const align = jc ? (jc === 'both' ? 'justify' : jc) : baseStyle.align;
    if (align) css.push(`text-align: ${align}`);

    // Spacing
    const spacing = child(pPr!, 'spacing');
    if (spacing) {
      const line = attr(spacing, 'line');
      const lineRule = attr(spacing, 'lineRule');
      if (line) {
        if (lineRule === 'exact' || lineRule === 'atLeast') {
          css.push(`line-height: ${twipToPx(parseInt(line, 10))}px`);
        } else {
          css.push(`line-height: ${(parseInt(line, 10) / 240).toFixed(2)}`);
        }
      } else if (baseStyle.lineHeight) {
        css.push(`line-height: ${baseStyle.lineHeight}`);
      }

      const before = attr(spacing, 'before');
      css.push(`margin-top: ${before ? twipToPx(parseInt(before, 10)) : (baseStyle.marginTop || 0)}px`);

      const after = attr(spacing, 'after');
      css.push(`margin-bottom: ${after ? twipToPx(parseInt(after, 10)) : (baseStyle.marginBottom || 0)}px`);
    } else {
      if (baseStyle.lineHeight) css.push(`line-height: ${baseStyle.lineHeight}`);
      css.push(`margin-top: ${baseStyle.marginTop || 0}px`);
      css.push(`margin-bottom: ${baseStyle.marginBottom || 0}px`);
    }

    // Indentation
    const ind = child(pPr!, 'ind');
    if (ind) {
      const left = attr(ind, 'left');
      if (left) css.push(`padding-left: ${twipToPx(parseInt(left, 10))}px`);
      else if (baseStyle.paddingLeft) css.push(`padding-left: ${baseStyle.paddingLeft}px`);

      const right = attr(ind, 'right');
      if (right) css.push(`padding-right: ${twipToPx(parseInt(right, 10))}px`);

      const firstLine = attr(ind, 'firstLine');
      const hanging = attr(ind, 'hanging');
      if (firstLine) css.push(`text-indent: ${twipToPx(parseInt(firstLine, 10))}px`);
      else if (hanging) css.push(`text-indent: -${twipToPx(parseInt(hanging, 10))}px`);
      else if (baseStyle.textIndent) css.push(`text-indent: ${baseStyle.textIndent}px`);
    } else {
      if (baseStyle.paddingLeft) css.push(`padding-left: ${baseStyle.paddingLeft}px`);
      if (baseStyle.paddingRight) css.push(`padding-right: ${baseStyle.paddingRight}px`);
      if (baseStyle.textIndent) css.push(`text-indent: ${baseStyle.textIndent}px`);
    }

    const styleStr = css.length ? ` style="${css.join('; ')}"` : '';

    // Process children (runs, hyperlinks, etc.)
    let innerHtml = '';
    for (const c of Array.from(pNode.children)) {
      const local = c.localName || c.nodeName.split(':').pop() || '';
      if (local === 'r') {
        innerHtml += processRun(c, baseStyle);
      } else if (local === 'hyperlink') {
        // Process runs inside hyperlink
        for (const hc of Array.from(c.children)) {
          const hLocal = hc.localName || hc.nodeName.split(':').pop() || '';
          if (hLocal === 'r') innerHtml += processRun(hc, baseStyle);
        }
      }
    }

    // If paragraph is completely empty, add a <br> for TipTap
    if (!innerHtml.trim()) {
      return `<p${styleStr}><br/></p>`;
    }

    return `<p${styleStr}>${innerHtml}</p>`;
  }

  // ── Process Run (text span) ──────────────────────────────────────────
  function processRun(rNode: Element, paraStyle: ParaStyle): string {
    const rPr = child(rNode, 'rPr');
    const css: string[] = [];
    let isBold = paraStyle.bold || false;
    let isItalic = paraStyle.italic || false;
    let isUnderline = false;
    let isStrike = false;

    if (rPr) {
      // Font
      const fonts = child(rPr, 'rFonts');
      if (fonts) {
        const fontName = attr(fonts, 'ascii') || attr(fonts, 'hAnsi') || attr(fonts, 'cs');
        if (fontName) css.push(`font-family: '${fontName}'`);
      } else if (paraStyle.fontFamily) {
        css.push(`font-family: '${paraStyle.fontFamily}'`);
      }

      // Size
      const sz = attr(child(rPr, 'sz'), 'val') || attr(child(rPr, 'szCs'), 'val');
      if (sz) {
        css.push(`font-size: ${hpToPt(parseInt(sz, 10))}pt`);
      } else if (paraStyle.fontSize) {
        css.push(`font-size: ${hpToPt(paraStyle.fontSize)}pt`);
      }

      // Color
      const color = attr(child(rPr, 'color'), 'val');
      if (color && color !== 'auto') css.push(`color: #${color}`);
      else if (paraStyle.color) css.push(`color: #${paraStyle.color}`);

      // Bold
      const b = child(rPr, 'b');
      if (b) isBold = attr(b, 'val') !== '0';
      const bCs = child(rPr, 'bCs');
      if (bCs && !b) isBold = attr(bCs, 'val') !== '0';

      // Italic
      const i = child(rPr, 'i');
      if (i) isItalic = attr(i, 'val') !== '0';
      const iCs = child(rPr, 'iCs');
      if (iCs && !i) isItalic = attr(iCs, 'val') !== '0';

      // Underline
      const u = child(rPr, 'u');
      if (u && attr(u, 'val') !== 'none') isUnderline = true;

      // Strikethrough
      if (child(rPr, 'strike')) isStrike = true;

      // Highlight / Background
      const highlight = attr(child(rPr, 'highlight'), 'val');
      if (highlight && highlight !== 'none') {
        const highlightColors: Record<string, string> = {
          yellow: '#ffff00', green: '#00ff00', cyan: '#00ffff',
          magenta: '#ff00ff', blue: '#0000ff', red: '#ff0000',
          darkBlue: '#000080', darkCyan: '#008080', darkGreen: '#008000',
          darkMagenta: '#800080', darkRed: '#800000', darkYellow: '#808000',
          darkGray: '#808080', lightGray: '#c0c0c0', black: '#000000',
        };
        css.push(`background-color: ${highlightColors[highlight] || '#ffff00'}`);
      }

      // Superscript / Subscript
      const vertAlign = attr(child(rPr, 'vertAlign'), 'val');
      if (vertAlign === 'superscript') css.push('vertical-align: super; font-size: smaller');
      if (vertAlign === 'subscript') css.push('vertical-align: sub; font-size: smaller');
    } else {
      // No run properties — use paragraph/style defaults
      if (paraStyle.fontFamily) css.push(`font-family: '${paraStyle.fontFamily}'`);
      if (paraStyle.fontSize) css.push(`font-size: ${hpToPt(paraStyle.fontSize)}pt`);
      if (paraStyle.color) css.push(`color: #${paraStyle.color}`);
    }

    // Collect text content
    let textContent = '';
    for (const c of Array.from(rNode.children)) {
      const local = c.localName || c.nodeName.split(':').pop() || '';
      if (local === 't') {
        textContent += c.textContent || '';
      } else if (local === 'br') {
        textContent += '<br/>';
      } else if (local === 'tab') {
        textContent += '<span style="display:inline-block;width:36px"></span>';
      } else if (local === 'drawing' || local === 'pict') {
        // Try to extract inline images
        const img = extractImage(c);
        if (img) textContent += img;
      }
    }

    if (!textContent) return '';

    // Wrap in formatting tags
    if (isBold) textContent = `<strong>${textContent}</strong>`;
    if (isItalic) textContent = `<em>${textContent}</em>`;
    if (isUnderline) textContent = `<u>${textContent}</u>`;
    if (isStrike) textContent = `<s>${textContent}</s>`;

    const styleStr = css.length ? ` style="${css.join('; ')}"` : '';
    return `<span${styleStr}>${textContent}</span>`;
  }

  // ── Extract Image ──────────────────────────────────────────────────
  function extractImage(node: Element): string {
    // Find the blip element (contains r:embed reference to image)
    const blips = node.getElementsByTagNameNS('*', 'blip');
    for (let i = 0; i < blips.length; i++) {
      const blip = blips[i];
      const embedId = blip.getAttribute('r:embed');
      if (embedId && imageRels.has(embedId)) {
        const imgPath = imageRels.get(embedId)!;
        const fullPath = imgPath.startsWith('word/') ? imgPath : `word/${imgPath}`;
        const imgFile = zip.file(fullPath);
        if (imgFile) {
          // We'll load the image async — for now insert a placeholder
          // that will be replaced. Actually, since we're async already,
          // we can't easily do this inline. Use a data URL approach.
          return `<img data-docx-image="${fullPath}" style="max-width: 100%; height: auto;" />`;
        }
      }
    }

    // Try to find extent (size) info
    const extents = node.getElementsByTagNameNS('*', 'extent');
    let w = 0, h = 0;
    if (extents.length > 0) {
      const cx = extents[0].getAttribute('cx');
      const cy = extents[0].getAttribute('cy');
      if (cx) w = emuToPx(parseInt(cx, 10));
      if (cy) h = emuToPx(parseInt(cy, 10));
    }

    return '';
  }

  // ── Process Table ──────────────────────────────────────────────────
  function processTable(tblNode: Element): string {
    // Table properties
    const tblPr = child(tblNode, 'tblPr');
    const tblCss: string[] = ['border-collapse: collapse'];

    // Table width
    const tblW = child(tblPr!, 'tblW');
    if (tblW) {
      const w = attr(tblW, 'w');
      const type = attr(tblW, 'type');
      if (w && type === 'dxa') {
        tblCss.push(`width: ${twipToPx(parseInt(w, 10))}px`);
      } else if (w && type === 'pct') {
        tblCss.push(`width: ${parseInt(w, 10) / 50}%`);
      } else {
        tblCss.push('width: 100%');
      }
    } else {
      tblCss.push('width: 100%');
    }

    // Table alignment
    const tblJc = attr(child(tblPr!, 'jc'), 'val');
    if (tblJc === 'center') tblCss.push('margin-left: auto; margin-right: auto');

    let html = `<table style="${tblCss.join('; ')}"><tbody>`;

    // Table Grid (column widths)
    const tblGrid = child(tblNode, 'tblGrid');
    const colWidths: number[] = [];
    if (tblGrid) {
      for (const gc of children(tblGrid, 'gridCol')) {
        const w = attr(gc, 'w');
        if (w) colWidths.push(twipToPx(parseInt(w, 10)));
      }
    }

    // Rows
    let colIndex = 0;
    for (const tr of children(tblNode, 'tr')) {
      html += '<tr>';
      colIndex = 0;
      for (const tc of children(tr, 'tc')) {
        const tcPr = child(tc, 'tcPr');
        const cellCss: string[] = ['border: 1px solid #000', 'padding: 4px 6px', 'vertical-align: top'];

        // Cell width
        const tcW = child(tcPr!, 'tcW');
        if (tcW) {
          const w = attr(tcW, 'w');
          const type = attr(tcW, 'type');
          if (w && type === 'dxa') {
            cellCss.push(`width: ${twipToPx(parseInt(w, 10))}px`);
          }
        } else if (colIndex < colWidths.length) {
          cellCss.push(`width: ${colWidths[colIndex]}px`);
        }

        // Cell merge (colspan)
        const gridSpan = attr(child(tcPr!, 'gridSpan'), 'val');
        const colspanAttr = gridSpan && parseInt(gridSpan, 10) > 1
          ? ` colspan="${gridSpan}"` : '';

        // Cell merge (rowspan) — vMerge with val="restart" starts a span
        const vMerge = child(tcPr!, 'vMerge');
        if (vMerge && !attr(vMerge, 'val')) {
          // This is a continuation cell (merged from above) — skip
          colIndex += gridSpan ? parseInt(gridSpan, 10) : 1;
          continue;
        }

        // Cell vertical alignment
        const vAlign = attr(child(tcPr!, 'vAlign'), 'val');
        if (vAlign === 'center') cellCss.push('vertical-align: middle');
        else if (vAlign === 'bottom') cellCss.push('vertical-align: bottom');

        // Cell shading (background color)
        const shd = child(tcPr!, 'shd');
        if (shd) {
          const fill = attr(shd, 'fill');
          if (fill && fill !== 'auto' && fill !== 'FFFFFF') {
            cellCss.push(`background-color: #${fill}`);
          }
        }

        // Cell borders
        const tcBorders = child(tcPr!, 'tcBorders');
        if (tcBorders) {
          for (const side of ['top', 'bottom', 'left', 'right']) {
            const border = child(tcBorders, side);
            if (border) {
              const val = attr(border, 'val');
              if (val === 'nil' || val === 'none') {
                cellCss.push(`border-${side}: none`);
              } else {
                const sz = attr(border, 'sz');
                const color = attr(border, 'color');
                const width = sz ? Math.max(1, Math.round(parseInt(sz, 10) / 8)) : 1;
                const borderColor = color && color !== 'auto' ? `#${color}` : '#000';
                cellCss.push(`border-${side}: ${width}px solid ${borderColor}`);
              }
            }
          }
        }

        html += `<td${colspanAttr} style="${cellCss.join('; ')}">`;

        // Cell content (paragraphs and nested tables)
        for (const cc of Array.from(tc.children)) {
          const local = cc.localName || cc.nodeName.split(':').pop() || '';
          if (local === 'p') html += processParagraph(cc);
          else if (local === 'tbl') html += processTable(cc);
        }

        html += '</td>';
        colIndex += gridSpan ? parseInt(gridSpan, 10) : 1;
      }
      html += '</tr>';
    }

    html += '</tbody></table>';
    return html;
  }

  // ── Process Document Body ──────────────────────────────────────────
  let finalHtml = '';
  for (const node of Array.from(body.children)) {
    const local = node.localName || node.nodeName.split(':').pop() || '';
    if (local === 'p') {
      finalHtml += processParagraph(node);
    } else if (local === 'tbl') {
      finalHtml += processTable(node);
    }
  }

  // ── Post-process: Load images as base64 ────────────────────────────
  const imgRegex = /data-docx-image="([^"]+)"/g;
  let match;
  while ((match = imgRegex.exec(finalHtml)) !== null) {
    const imgPath = match[1];
    const imgFile = zip.file(imgPath);
    if (imgFile) {
      try {
        const imgData = await imgFile.async('base64');
        const ext = imgPath.split('.').pop()?.toLowerCase() || 'png';
        const mimeMap: Record<string, string> = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          gif: 'image/gif', bmp: 'image/bmp', svg: 'image/svg+xml',
          tiff: 'image/tiff', emf: 'image/emf', wmf: 'image/wmf',
        };
        const mime = mimeMap[ext] || 'image/png';
        finalHtml = finalHtml.replace(
          `data-docx-image="${imgPath}"`,
          `src="data:${mime};base64,${imgData}"`
        );
      } catch { /* image extraction failed, leave placeholder */ }
    }
  }

  return finalHtml;
}
