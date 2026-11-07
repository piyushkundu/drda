"""Prepare the three current monthly letter templates without changing the reference.

Run with the bundled workspace Python and the supplied reference DOCX path.
Only word/document.xml changes; all other package entries remain byte-for-byte.
"""
import argparse
from copy import deepcopy
from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E

parser = argparse.ArgumentParser()
parser.add_argument('reference')
parser.add_argument('--out', default='public/templates/social-audit-mpr-2026.docx')
args = parser.parse_args()
source, output = Path(args.reference), Path(args.out)
if source.resolve() == output.resolve():
    raise ValueError('Reference and output must differ')
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns = {'w': W}
q = lambda local: '{' + W + '}' + local

with ZipFile(source) as archive:
    root = E.fromstring(archive.read('word/document.xml'))
    body = root.find('w:body', ns)
    children = list(body)
    if len(children) != 105 or not children[12].tag.endswith('}tbl') or not children[47].tag.endswith('}tbl'):
        raise ValueError('Unrecognised reference structure; inspect the source again')
    for child in children[52:]:
        if child.tag != q('sectPr'):
            body.remove(child)
    def text(node):
        return ''.join(node.xpath('.//w:t/text()', namespaces=ns))
    def replace_text(node, value):
        texts = node.findall('.//w:t', ns)
        if not texts:
            run = E.SubElement(node.find('w:p',ns) if node.tag == q('tc') else node, q('r'))
            texts = [E.SubElement(run, q('t'))]
        texts[0].text = value
        texts[0].set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        for item in texts[1:]:
            item.text = ''
    def cell(table_index, row, column=-1):
        return children[table_index].findall('w:tr', ns)[row].findall('w:tc', ns)[column]
    def slot(table_index, row, key, column=-1):
        replace_text(cell(table_index,row,column), '{{' + key + '}}')
    slot(12,1,'pmay_completed')
    slot(12,2,'pmay_houses')
    for column,key in enumerate(['pmay_sc','pmay_st','pmay_minority','pmay_disabled','pmay_other'],1):
        slot(12,5,key,column)
    for row,key in enumerate(['pmay_findings','pmay_resolved_meeting','pmay_unresolved','pmay_resolved_total','pmay_misused','pmay_recovered','pmay_fir','pmay_action'],6):
        slot(12,row,key)
    replace_text(cell(29,1), text(cell(29,1)).rsplit('55',1)[0] + '{{mgnrega_calendar}}')
    for row,key in enumerate(['mgnrega_completed','mgnrega_uploaded','mgnrega_no_records','mgnrega_supervisor_absent','mgnrega_findings','mgnrega_resolved','mgnrega_unresolved','mgnrega_financial','mgnrega_deviation','mgnrega_recovered','mgnrega_fir','mgnrega_action'],2):
        slot(29,row,key)
    nsap_keys=['proposed_fy','proposed','completed','total','direct','family','ineligible','deceased','financial']
    for prefix,start in [('nsap',1),('nfbs',11)]:
        for row,key in enumerate(nsap_keys,start): slot(47,row,prefix+'_'+key)
    replace_text(cell(47,10), '')
    for table_index in [12,29]:
        heading=cell(table_index,0)
        replace_text(heading,text(heading).replace('October 2026','{{PERIOD_EN}}'))
    # Month words can be split across Word runs; replace their full label cell.
    for target in children[47].findall('.//w:tc',ns):
        original=text(target)
        changed=original.replace('vDVwcj','{{MONTH_HI}}').replace('vDVqcj','{{MONTH_HI}}')
        if changed != original: replace_text(target,changed)
    # Correct the PMAY subject's scheme while keeping its exact source formatting.
    replace_text(children[8], text(children[8]).replace('egkRek xka/kh ujsxk ;kstuk ¼01 tqykbZ ] 2026 ls ohch&th jke th ½','iz/kkuea=h vkokl ;kstuk&xzkeh.k'))
    for paragraph in body.findall('.//w:p',ns):
        for marker in paragraph.findall('.//w:lastRenderedPageBreak',ns): marker.getparent().remove(marker)
        for br in paragraph.findall('.//w:br',ns):
            if br.get(q('type')) == 'page': br.getparent().remove(br)
    for index in [17,36]:
        if index == 17:
            # The source's NoSpacing sender line disappears in native Word PDF.
            # Reuse the identical visible sender component from its first letter.
            replacement=deepcopy(children[0])
            replacement.attrib.update(children[index].attrib)
            body.replace(children[index],replacement)
            children[index]=replacement
        properties=children[index].find('w:pPr',ns)
        if properties is None:
            properties=E.Element(q('pPr'));children[index].insert(0,properties)
        for old in properties.findall('w:pageBreakBefore',ns): properties.remove(old)
        properties.insert(1 if properties.find('w:pStyle',ns) is not None else 0,E.Element(q('pageBreakBefore')))
    # The source already distinguishes Kruti Hindi from Arial English/serials.
    # Preserve that distinction: Latin a)/b), 1.A and English must not use Kruti.
    for run in body.findall('.//w:r',ns):
        properties=run.find('w:rPr',ns)
        if properties is None: continue
        fonts=properties.find('w:rFonts',ns)
        if fonts is None or not any('Kruti' in value for value in fonts.attrib.values()): continue
        for attribute in list(fonts.attrib):
            if attribute.endswith('Theme'): del fonts.attrib[attribute]
        for attribute in ['ascii','hAnsi','eastAsia','cs']: fonts.set(q(attribute),'Kruti Dev 010')
        for t in run.findall('w:t',ns):
            if t.text: t.text=t.text.replace('।','A')
    output.parent.mkdir(parents=True,exist_ok=True)
    with ZipFile(output,'w') as target:
        for info in archive.infolist():
            target.writestr(info,E.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True) if info.filename=='word/document.xml' else archive.read(info.filename))
print(output)
