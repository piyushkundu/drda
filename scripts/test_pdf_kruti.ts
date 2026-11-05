import { jsPDF } from 'jspdf';
import fs from 'fs';

const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: 'a4'
});

const fontBase64 = fs.readFileSync('public/fonts/KrutiDev010.ttf').toString('base64');
doc.addFileToVFS('KrutiDev010.ttf', fontBase64);
doc.addFont('KrutiDev010.ttf', 'KrutiDev010', 'normal');

doc.setFont('KrutiDev010', 'normal');
doc.setFontSize(16);
doc.text("lks'ky vkfMV dys.Mj foRrh; o\"kZ 2026-27 tuin ckxir", 148, 15, { align: 'center' });

doc.setFontSize(10);
doc.text("xzke iapk;r dk uke% vgSM+k", 20, 25);
doc.text("ch0vkj0ih0% gfjfd'ku (8859660315)", 20, 32);

const buffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync('test_kruti.pdf', buffer);
console.log('Successfully wrote test_kruti.pdf, bytes:', buffer.length);

