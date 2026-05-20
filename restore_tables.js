const fs = require('fs');
const path = 'c:/Users/piyus/OneDrive/Desktop/page hindi/page-hindi/src/lib/templates/index.ts';
let content = fs.readFileSync(path, 'utf8');

// For the left/right sections like पत्रांक and दिनांक
const spaceRegex = /<p>([\s\S]*?) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;([\s\S]*?)<\/p>/g;
content = content.replace(spaceRegex, (match, p1, p2) => {
  return '<table style=\"width:100%; border:none !important; margin:10px 0;\"><tr><td style=\"border:none !important;\">' + p1.trim() + '</td><td style=\"border:none !important; text-align:right;\">' + p2.trim() + '</td></tr></table>';
});

// For the signature blocks
const sigRegex = /<p>([\s\S]*?) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ([\s\S]*?)<\/p>/g;
content = content.replace(sigRegex, (match, p1, p2) => {
  return '<table style=\"width:100%; border:none !important; margin:20px 0;\"><tr><td style=\"border:none !important; text-align:left;\">' + p1.trim().replace(/ /g, '<br/>') + '</td><td style=\"border:none !important; text-align:right;\">' + p2.trim().replace(/ /g, '<br/>') + '</td></tr></table>';
});

fs.writeFileSync(path, content, 'utf8');
console.log('Restored tables with !important');
