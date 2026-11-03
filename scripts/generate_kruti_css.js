const fs = require('fs');
const buf = fs.readFileSync('public/fonts/KrutiDev010.ttf');
const b64 = buf.toString('base64');

const css = `/* Embedded Kruti Dev 010 Font - Zero Latency, 100% Offline & Network Resilient */
@font-face {
  font-family: 'Kruti Dev 010';
  src: local('Kruti Dev 010'), local('KrutiDev010'), local('Kruti Dev'),
       url('data:font/truetype;charset=utf-8;base64,${b64}') format('truetype'),
       url('/fonts/KrutiDev010.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

@font-face {
  font-family: 'KrutiDev010';
  src: local('Kruti Dev 010'), local('KrutiDev010'), local('Kruti Dev'),
       url('data:font/truetype;charset=utf-8;base64,${b64}') format('truetype'),
       url('/fonts/KrutiDev010.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

@font-face {
  font-family: 'Kruti Dev';
  src: local('Kruti Dev 010'), local('KrutiDev010'), local('Kruti Dev'),
       url('data:font/truetype;charset=utf-8;base64,${b64}') format('truetype'),
       url('/fonts/KrutiDev010.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

.font-kruti {
  font-family: 'Kruti Dev 010', 'KrutiDev010', 'Kruti Dev', sans-serif !important;
}
`;

fs.writeFileSync('src/app/krutidev-font.css', css, 'utf8');
console.log('Successfully generated src/app/krutidev-font.css, size:', css.length);

