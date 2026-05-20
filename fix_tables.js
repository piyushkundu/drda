const fs = require('fs');
const path = 'c:/Users/piyus/OneDrive/Desktop/page hindi/page-hindi/src/lib/templates/index.ts';
let content = fs.readFileSync(path, 'utf8');

// Regex to find all these layout tables
const regex = /<table style="width:100%; border:none[^>]*?>\s*<tr>\s*<td style="border:none[^>]*?>([\s\S]*?)<\/td>\s*<td style="border:none[^>]*?>([\s\S]*?)<\/td>\s*<\/tr>\s*<\/table>/g;

content = content.replace(regex, (match, p1, p2) => {
  // Check if it's the signature block or just standard left/right
  p1 = p1.trim();
  p2 = p2.trim();
  
  if (p1.includes('हस्ताक्षर')) {
    // replace <br/> with space to keep them inline? 
    // Actually just keep them side by side but with space
    // Let's use 40 spaces
    return '<p>' + p1.replace(/<br\/>/g, ' ') + ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + p2.replace(/<br\/>/g, ' ') + '</p>';
  }
  
  return '<p>' + p1 + ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + p2 + '</p>';
});

fs.writeFileSync(path, content, 'utf8');
console.log('Done modifying templates');
