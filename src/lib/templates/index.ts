// ============================================
// Government Document Templates
// Social Audit & District Office — Complete Collection
// ============================================
import type { Template } from '@/types';

export const governmentTemplates: Template[] = [
  // ============================================
  // 1. IGRS शिकायत निस्तारण पत्र
  // ============================================
  {
    id: 'complaint-disposal',
    name: 'Complaint Disposal (IGRS)',
    nameHindi: 'शिकायत निस्तारण पत्र',
    category: 'complaint',
    department: 'DRDA',
    description: 'IGRS पोर्टल पर प्राप्त शिकायत का निस्तारण हेतु मानक पत्र',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p><strong>प्रेषक,</strong></p>
<table style="width:100%; border:none !important; margin:0;">
  <tr>
    <td style="width:15%; border:none !important;"></td>
    <td style="width:85%; border:none !important;">
      परियोजना निदेशक,<br/>
      जिला ग्राम्य विकास अभिकरण<br/>
      बागपत।
    </td>
  </tr>
</table>

<p><strong>सेवा में,</strong></p>
<table style="width:100%; border:none !important; margin:0;">
  <tr>
    <td style="width:15%; border:none !important;"></td>
    <td style="width:85%; border:none !important;">
      जिलाधिकारी,<br/>
      बागपत।
    </td>
  </tr>
</table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr>
  <td style="border:none !important;">पत्रांक &nbsp;&nbsp;&nbsp;/जी०सी०/सि०/2026-27</td>
  <td style="border:none !important; text-align:right;">दिनांक &nbsp;&nbsp;&nbsp;</td>
</tr></table>

<p><strong>विषय &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;आई०जी०आर०एस० पोर्टल पर प्राप्त शिकायत संख्या _______________ दिनांक _______________ का निस्तारण किये जाने के सम्बन्ध में।</strong></p>

<p>महोदय,</p>

<p style="text-indent:40px;">कृपया उपरोक्त विषयक आई०जी०आर०एस० पोर्टल पर प्राप्त शिकायत संख्या _______________ का अवलोकन करने का कष्ट करें, जिसके द्वारा श्री/श्रीमती _______________ निवासी _______________ जनपद बागपत द्वारा _______________ की माँग की जा रही है।</p>

<p style="text-indent:40px;">उक्त शिकायत की जाँच खण्ड विकास अधिकारी _______________ द्वारा करायी गयी। उन्होंने अपने कार्यालय पत्रांक _______________ दिनांक _______________ के द्वारा अपनी जाँच आख्या में अवगत कराया है कि _______________। अतः शिकायतकर्ता _______________ हेतु अपात्र/पात्र हैं। उक्त के विषय में आवेदक को उनके दूरभाष पर भी अवगत कराया जा चुका है। और वह सन्तुष्ट हैं।</p>

<p>अतः शिकायत को निस्तारित करने का कष्ट करें।</p>

<p>सलग्न जाँच आख्या।</p>

<table style="width:100%; border:none !important; margin:0;">
  <tr>
    <td style="width:60%; border:none !important;"></td>
    <td style="width:40%; border:none !important; text-align:center;">
      परियोजना निदेशक,<br/>
      जिला ग्राम्य विकास अभिकरण<br/>
      बागपत।
    </td>
  </tr>
</table>

<p><strong>प्रतिलिपि :-</strong> मुख्य विकास अधिकारी महोदय, बागपत की सेवा में सादर सूचनार्थ प्रेषित।</p>

<table style="width:100%; border:none !important; margin:0;">
  <tr>
    <td style="width:60%; border:none !important;"></td>
    <td style="width:40%; border:none !important; text-align:center;">
      परियोजना निदेशक,<br/>
      जिला ग्राम्य विकास अभिकरण<br/>
      बागपत।
    </td>
  </tr>
</table>
</div>`,
  },

  // ============================================
  // 2. सामाजिक अंकेक्षण बैठक कार्यवृत्त
  // ============================================
  {
    id: 'social-audit-meeting',
    name: 'Social Audit Meeting Minutes',
    nameHindi: 'सामाजिक अंकेक्षण बैठक कार्यवृत्त',
    category: 'report',
    department: 'Social Audit',
    description: 'सोशल ऑडिट बैठक की कार्यवाही एवं निर्णयों का विवरण',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<p style="text-align:center;"><strong>सामाजिक अंकेक्षण बैठक कार्यवृत्त</strong></p>
<hr/>

<p><strong>दिनांक:</strong> ___/___/______</p>
<p><strong>समय:</strong> _______________ बजे</p>
<p><strong>स्थान:</strong> कार्यालय जिला विकास अधिकारी, बागपत</p>

<p><strong>अध्यक्षता:</strong> श्री/श्रीमती _______________, जिला विकास अधिकारी, बागपत</p>

<p><strong>उपस्थित सदस्यगण:</strong></p>
<ol>
  <li>श्री/श्रीमती _______________, जिला पंचायत राज अधिकारी, बागपत</li>
  <li>श्री/श्रीमती _______________, खण्ड विकास अधिकारी, _______________</li>
  <li>श्री/श्रीमती _______________, सोशल ऑडिट नोडल अधिकारी</li>
  <li>श्री/श्रीमती _______________, सोशल ऑडिट रिसोर्स पर्सन</li>
</ol>

<p><strong>एजेण्डा बिन्दुओं पर विचार-विमर्श एवं निर्णय:</strong></p>

<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse;">
  <thead>
    <tr style="background-color:#f2f2f2;">
      <th style="width:8%;">क्र०सं०</th>
      <th style="width:35%;">एजेण्डा बिन्दु</th>
      <th style="width:35%;">विचार-विमर्श</th>
      <th style="width:22%;">निर्णय/कार्यवाही</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>वित्तीय वर्ष 2025-26 में निर्गत कैलेण्डर के सापेक्ष सोशल ऑडिट की प्रगति की समीक्षा।</td>
      <td>वित्तीय वर्ष 2025-26 में निर्गत कैलेण्डर के अनुसार कुल ___ ग्राम पंचायतों में सोशल ऑडिट सम्पन्न कराया गया है। शेष ___ ग्राम पंचायतों में कार्य प्रगति पर है।</td>
      <td>शेष ग्राम पंचायतों में शीघ्रातिशीघ्र सोशल ऑडिट पूर्ण कराया जाये।</td>
    </tr>
    <tr>
      <td>2</td>
      <td>सोशल ऑडिट में चिन्हित बिन्दुओं पर ATR की स्थिति।</td>
      <td>कुल ___ बिन्दु चिन्हित किये गये हैं जिनमें से ___ पर कार्यवाही पूर्ण हो चुकी है तथा ___ पर कार्यवाही प्रगति पर है।</td>
      <td>लम्बित ATR 15 दिवस के अन्दर पूर्ण किया जाये।</td>
    </tr>
    <tr>
      <td>3</td>
      <td>सोशल ऑडिट टीम सदस्यों के मानदेय भुगतान की स्थिति।</td>
      <td>वित्तीय वर्ष 2025-26 में कुल ___ सदस्यों का मानदेय भुगतान लम्बित है।</td>
      <td>PFMS पोर्टल पर यथाशीघ्र भुगतान सुनिश्चित किया जाये।</td>
    </tr>
    <tr>
      <td>4</td>
      <td>MIS पर रिपोर्ट अपलोडिंग की प्रगति।</td>
      <td>___ ग्राम पंचायतों की रिपोर्ट MIS पर अपलोड की जा चुकी है। ___ ग्राम पंचायतों की रिपोर्ट अपलोडिंग शेष है।</td>
      <td>शेष रिपोर्ट 7 दिवस के अन्दर अपलोड की जाये।</td>
    </tr>
  </tbody>
</table>

<p> <strong>अगली बैठक की तिथि:</strong> ___/___/______</p>

<p style="text-align:right;"><strong>जिला विकास अधिकारी,</strong><br/>
बागपत।</p>
</div>`,
  },

  // ============================================
  // 3. सोशल ऑडिट टीम सदस्य हेतु आवेदन पत्र
  // ============================================
  {
    id: 'sa-team-application',
    name: 'Social Audit Team Member Application',
    nameHindi: 'सोशल ऑडिट टीम सदस्य आवेदन पत्र',
    category: 'letter',
    department: 'Social Audit',
    description: 'सोशल ऑडिट टीम में सदस्य के रूप में चयन हेतु आवेदन पत्र (SATM)',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>सोशल ऑडिट टीम सदस्य (SATM) हेतु आवेदन पत्र</strong></p>
<p style="text-align:center;"><strong>वित्तीय वर्ष 2026-27</strong></p>
<hr/>

<p style="text-align:right;">दिनांक: ___/___/______</p>

<p><strong>सेवा में,</strong><br/>
जिला विकास अधिकारी,<br/>
बागपत।</p>

<p>विषय: सोशल ऑडिट टीम सदस्य (SATM) के रूप में चयन हेतु आवेदन पत्र।</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">सविनय निवेदन है कि मैं _______________ पुत्र/पुत्री/पत्नी श्री _______________ निवासी ग्राम _______________ पोस्ट _______________ तहसील _______________ जनपद बागपत, सोशल ऑडिट टीम सदस्य (SATM) के पद पर चयन हेतु आवेदन करता/करती हूँ।</p>

<p><strong>व्यक्तिगत विवरण:</strong></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse;">
  <tr>
    <td style="width:5%;">1.</td>
    <td style="width:40%;">आवेदक का नाम</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>2.</td>
    <td>पिता/पति का नाम</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>3.</td>
    <td>जन्म तिथि</td>
    <td>___/___/______</td>
  </tr>
  <tr>
    <td>4.</td>
    <td>आयु (आवेदन तिथि पर)</td>
    <td>_______________ वर्ष</td>
  </tr>
  <tr>
    <td>5.</td>
    <td>लिंग</td>
    <td>पुरुष / महिला / अन्य</td>
  </tr>
  <tr>
    <td>6.</td>
    <td>जाति श्रेणी</td>
    <td>सामान्य / ओ०बी०सी० / अनु०जा० / अनु०ज०जा०</td>
  </tr>
  <tr>
    <td>7.</td>
    <td>शैक्षिक योग्यता</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>8.</td>
    <td>पूर्ण पता</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>9.</td>
    <td>मोबाइल नम्बर</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>10.</td>
    <td>आधार संख्या</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>11.</td>
    <td>बैंक खाता संख्या</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>12.</td>
    <td>IFSC कोड</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>13.</td>
    <td>बैंक शाखा का नाम</td>
    <td>_______________</td>
  </tr>
</table>

<p><strong>संलग्नक:</strong></p>
<ol>
  <li>आधार कार्ड की छायाप्रति</li>
  <li>शैक्षिक प्रमाण पत्र की छायाप्रति</li>
  <li>बैंक पासबुक की छायाप्रति</li>
  <li>नवीनतम पासपोर्ट साइज फोटो (2 नग)</li>
  <li>जाति प्रमाण पत्र की छायाप्रति (यदि लागू हो)</li>
</ol>

<p><strong>घोषणा:</strong> मैं प्रमाणित करता/करती हूँ कि उपरोक्त समस्त सूचनाएं सत्य एवं सही हैं। यदि कोई सूचना असत्य पायी जाती है तो मेरे विरुद्ध कार्यवाही की जा सकती है।</p>

<p style="text-align:right;"> <strong>आवेदक के हस्ताक्षर</strong><br/>
नाम: _______________<br/>
दिनांक: ___/___/______</p>
</div>`,
  },

  // ============================================
  // 4. सामाजिक अंकेक्षण ATR पत्र
  // ============================================
  {
    id: 'social-audit-atr-letter',
    name: 'Social Audit ATR Letter',
    nameHindi: 'सामाजिक अंकेक्षण ATR पत्र',
    category: 'letter',
    department: 'Social Audit',
    description: 'सामाजिक अंकेक्षण में चिन्हित बिन्दुओं पर कार्यवाही रिपोर्ट (ATR) प्रेषण',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p><strong>प्रेषक,</strong></p>
<table style="width:100%; border:none !important; margin:0;">
  <tr>
    <td style="width:15%; border:none !important;"></td>
    <td style="width:85%; border:none !important;">
      जिला विकास अधिकारी,<br/>
      बागपत।
    </td>
  </tr>
</table>

<p><strong>सेवा में,</strong></p>
<table style="width:100%; border:none !important; margin:0;">
  <tr>
    <td style="width:15%; border:none !important;"></td>
    <td style="width:85%; border:none !important;">
      निदेशक,<br/>
      सामाजिक अंकेक्षण इकाई<br/>
      उत्तर प्रदेश।
    </td>
  </tr>
</table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr>
  <td style="border:none !important;">पत्रांक &nbsp;&nbsp;&nbsp;/सो०ऑ०/ATR/2026-27</td>
  <td style="border:none !important; text-align:right;">दिनांक &nbsp;&nbsp;&nbsp;</td>
</tr></table>

<p><strong>विषय &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;सामाजिक अंकेक्षण में चिन्हित बिन्दुओं पर कार्यवाही रिपोर्ट (ATR) के सम्बन्ध में।</strong></p>

<p>महोदय,</p>

<p style="text-indent:40px;">कृपया उपरोक्त विषयक सामाजिक अंकेक्षण दल द्वारा ग्राम पंचायत _______________ विकास खण्ड _______________ में दिनांक _______________ से _______________ तक किये गये सामाजिक अंकेक्षण में चिन्हित बिन्दुओं पर कार्यवाही रिपोर्ट (ATR) का अवलोकन करने का कष्ट करें।</p>

<p style="text-indent:40px;">उक्त सामाजिक अंकेक्षण में कुल ___ बिन्दु चिन्हित किये गये थे। जिनमें से ___ बिन्दुओं पर सम्बन्धित अधिकारियों/कर्मचारियों द्वारा कार्यवाही पूर्ण कर ली गयी है तथा शेष ___ बिन्दुओं पर कार्यवाही प्रगति पर है।</p>

<p style="text-indent:40px;">जाँच में पाया गया कि सम्बन्धित योजनाओं में लाभार्थियों का चयन नियमानुसार किया गया है। जहाँ त्रुटियाँ पायी गयी हैं वहाँ सुधारात्मक कार्यवाही कर दी गयी है। समस्त चिन्हित बिन्दुओं का निस्तारण किया जा रहा है।</p>

<p>अतः कार्यवाही रिपोर्ट (ATR) संलग्न कर प्रेषित की जाती है। कृपया अवगत होने का कष्ट करें।</p>

<p>सलग्न: ATR विवरण (अनुलग्नक-1)</p>

<table style="width:100%; border:none !important; margin:0;">
  <tr>
    <td style="width:60%; border:none !important;"></td>
    <td style="width:40%; border:none !important; text-align:center;">
      जिला विकास अधिकारी,<br/>
      बागपत।
    </td>
  </tr>
</table>

<p><strong>प्रतिलिपि :-</strong></p>
<ol>
  <li>जिलाधिकारी महोदय, बागपत की सेवा में सादर अवलोकनार्थ प्रेषित।</li>
  <li>मुख्य विकास अधिकारी महोदय, बागपत की सेवा में सादर सूचनार्थ प्रेषित।</li>
</ol>

<table style="width:100%; border:none !important; margin:0;">
  <tr>
    <td style="width:60%; border:none !important;"></td>
    <td style="width:40%; border:none !important; text-align:center;">
      जिला विकास अधिकारी,<br/>
      बागपत।
    </td>
  </tr>
</table>
</div>`,
  },

  // ============================================
  // 5. सोशल ऑडिट प्रगति रिपोर्ट (टेबल फॉर्मेट)
  // ============================================
  {
    id: 'sa-progress-report',
    name: 'Social Audit Progress Report',
    nameHindi: 'सोशल ऑडिट प्रगति रिपोर्ट',
    category: 'report',
    department: 'Social Audit',
    description: 'निदेशक सोशल ऑडिट की बैठक हेतु एजेण्डा-वार प्रगति रिपोर्ट',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<hr/>
<p style="text-align:center;"><strong>निदेशक, सोशल ऑडिट की अध्यक्षता में बैठक के एजेण्डा बिन्दुओं पर प्रगति सूचना / आख्या</strong></p>
<br/>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; text-align:left;">
  <thead>
    <tr style="background-color:#f2f2f2;">
      <th style="width:8%;">क्र०सं०</th>
      <th style="width:42%;">एजेण्डा बिन्दु</th>
      <th style="width:50%;">प्रगति सूचना / आख्या</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>वित्तीय वर्ष 2025-26 में निर्गत कैलेण्डर के सापेक्ष सोशल ऑडिट की प्रगति की समीक्षा।</td>
      <td>वित्तीय वर्ष 2025-26 में निर्गत कैलेण्डर 52 ग्राम पंचायतों के सापेक्ष 40 ग्राम पंचायतों में सोशल ऑडिट सम्पन्न कराया गया है। शेष 12 ग्राम पंचायतों में कार्य प्रगति पर है।</td>
    </tr>
    <tr>
      <td>2</td>
      <td>सोशल ऑडिट की मासिक प्रगति रिपोर्ट प्रेषण की समीक्षा।</td>
      <td>सोशल ऑडिट की मासिक प्रगति रिपोर्ट प्रत्येक माह की 05 तारीख तक मुख्यालय को प्रेषित की जाती है। माह _______________ तक की रिपोर्ट प्रेषित की जा चुकी है।</td>
    </tr>
    <tr>
      <td>3</td>
      <td>वित्तीय वर्ष 2025-26 में सम्पादित सोशल ऑडिट के सापेक्ष MIS पर रिपोर्ट अपलोडिंग की प्रगति की समीक्षा।</td>
      <td>वित्तीय वर्ष 2025-26 में सम्पादित 40 ग्राम पंचायतों के सोशल ऑडिट के सापेक्ष MIS पर पूर्ण रिपोर्ट अपलोड की गई है।</td>
    </tr>
    <tr>
      <td>4</td>
      <td>वित्तीय वर्ष 2025-26 तक सम्पादित सोशल ऑडिट के सापेक्ष ATR अपलोडिंग एवं क्लोजर की कार्यवाही की समीक्षा।</td>
      <td>कुल ___ ATR में से ___ का क्लोजर पूर्ण किया जा चुका है। शेष ___ ATR पर कार्यवाही प्रगति पर है। (विस्तृत विवरण संलग्न)</td>
    </tr>
    <tr>
      <td>5</td>
      <td>सोशल ऑडिट टीम सदस्यों के मानदेय भुगतान की स्थिति।</td>
      <td>वित्तीय वर्ष 2025-26 में कुल ___ टीम सदस्यों का मानदेय भुगतान PFMS पोर्टल के माध्यम से किया जा चुका है। ___ सदस्यों का भुगतान लम्बित है जो प्रक्रियाधीन है।</td>
    </tr>
    <tr>
      <td>6</td>
      <td>ग्राम सभा में सोशल ऑडिट रिपोर्ट प्रस्तुतीकरण की स्थिति।</td>
      <td>___ ग्राम पंचायतों में ग्राम सभा के समक्ष सोशल ऑडिट रिपोर्ट प्रस्तुत की जा चुकी है।</td>
    </tr>
  </tbody>
</table>
<p> <strong>भवदीय</strong></p>
<p style="text-align:right;">_______________ जिला विकास अधिकारी बागपत</p>
</div>`,
  },

  // ============================================
  // 6. सोशल ऑडिट मानदेय/वसूली नोटिस
  // ============================================
  {
    id: 'sa-notice-recovery',
    name: 'Social Audit Recovery Notice',
    nameHindi: 'सोशल ऑडिट नोटिस/वसूली पत्र',
    category: 'notice',
    department: 'Social Audit',
    description: 'सोशल ऑडिट टीम सदस्य को मानदेय भुगतान/वसूली हेतु नोटिस',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<hr/>
<p>पत्रांक: _____/सो०ऑ०/टीम भुगतान/2026-27</td><td style="border:none !important; text-align:right;">दिनांक: ___/___/______</td></tr></table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"><strong>प्रेषित,</strong></p>
<p>श्री/श्रीमती _______________<br/>
पुत्र/पुत्री/पत्नी श्री _______________<br/>
निवासी _______________<br/>
पूर्व सोशल ऑडिट टीम सदस्य।</p>

<p><strong>विषय:</strong> सोशल ऑडिट टीम सदस्य के मानदेय / व्यावसायिक शुल्क के भुगतान के संबंध में।</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">उपरोक्त विषयक इस कार्यालय के पत्र संख्या _______________ दिनांक _______________ का सन्दर्भ ग्रहण करें। आपके द्वारा वित्तीय वर्ष _______________ में सोशल ऑडिट का कार्य किया गया था। जिसके सापेक्ष अंकन रु० _______________ (अक्षरे रुपये _______________) का भुगतान त्रुटिवश PFMS पोर्टल पर आईडी क्रमांक _______________ द्वारा अधोहस्ताक्षरी के पदनाम से संचालित बैंक खाते के माध्यम से आपके खाते में क्रेडिट हो गया था।</p>

<p style="text-indent:40px;">उक्त धनराशि का भुगतान आप अपने खाते के माध्यम से सम्बंधित के खाता संख्या _______________ जिसका IFSC कोड _______________ बैंक शाखा _______________ में RTGS/NEFT के माध्यम से सम्बंधित को भुगतान कराते हुए कार्यालय को अवगत कराने के निर्देश दिए गए थे, परन्तु आज दिनांक तक आपके द्वारा कार्यालय को उक्त धनराशि के भुगतान के संबंध में अवगत नहीं कराया गया है। जो कि खेद का विषय है।</p>

<p style="text-indent:40px;">अतः आपको पुनः उक्त का सन्दर्भ प्रस्तुत किया जा रहा है। जिसका भुगतान कर तीन दिवस के अन्दर अधोहस्ताक्षरी को अनिवार्य रूप से अवगत कराने का कष्ट करें। इसमें किसी प्रकार की लापरवाही न बरती जाये। यदि उक्त धनराशि का भुगतान आपके द्वारा वित्तीय वर्ष की समाप्ति दिनांक 31-03-2027 तक नहीं कराया जाता है तो किसी भी प्रकार की कार्यवाही के लिए आप स्वयं उत्तरदायी होंगे।</p>

<p> <strong>भवदीय</strong></p>
<p style="text-align:right;">_______________ जिला विकास अधिकारी बागपत</p>
</div>`,
  },

  // ============================================
  // 7. ग्राम चौपाल परिपत्र
  // ============================================
  {
    id: 'gram-choupal-circular',
    name: 'Gram Choupal Circular',
    nameHindi: 'ग्राम चौपाल परिपत्र',
    category: 'order',
    department: 'Panchayat',
    description: 'ग्राम चौपाल एवं विशेष सफाई अभियान हेतु परिपत्र',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>अति-महत्वपूर्ण</strong></p>
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<hr/>
<p>पत्रांक: _____/ग्राम चौपाल/2026-27</td><td style="border:none !important; text-align:right;">दिनांक: ___/___/______</td></tr></table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"><strong>सेवा में,</strong></p>
<p>1. जिला पंचायत राज अधिकारी, बागपत<br/>
2. समस्त, खण्ड विकास अधिकारी, जनपद बागपत</p>

<p><strong>विषय:</strong> "ग्राम चौपाल" (गांव की समस्या, गाँव में समाधान) के आयोजन में दिनांक _______________ से _______________ तक विशेष सफाई अभियान चलाये जाने के सम्बन्ध में।</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">कृपया उपरोक्त विषयक संयुक्त विकास आयुक्त के कार्यालय पत्र संख्या _______________ दिनांक _______________ का सन्दर्भ ग्रहण करें जिसके द्वारा "ग्राम चौपाल" के आयोजन में विशेष सफाई अभियान चलाये जाने के लिये निर्देश प्राप्त हुए हैं।</p>

<p style="text-indent:40px;">उक्त के क्रम में आपको निर्देशित किया जाता है कि दिनांक _______________ से _______________ तक विशेष सफाई अभियान चलाया जाये। साथ ही आपको यह भी निर्देशित किया जाता है कि उक्त सफाई अभियान की सूचना प्रतिदिन फोटोग्राफ्स के माध्यम से अधोहस्ताक्षरी कार्यालय में उपलब्ध कराना सुनिश्चित करें, एवं जिन ग्राम पंचायतों में "ग्राम चौपाल" का आयोजन हो चुका है, उसके अगले चक्र में उस ग्राम से इतर ग्राम में "ग्राम चौपाल" का आयोजन किया जाये।</p>

<p><strong>संलग्नक:</strong> उपरोक्तानुसार।</p>

<p> <strong>भवदीय</strong></p>
<p style="text-align:right;">_______________ जिला विकास अधिकारी बागपत</p>

<p><strong>प्रतिलिपि:</strong> निम्नलिखित की सेवा में सादर अवलोकनार्थ एवं सूचनार्थ प्रेषित।<br/>
1. जिलाधिकारी महोदय, बागपत की सेवा में अवलोकनार्थ प्रेषित।<br/>
2. मुख्य विकास अधिकारी महोदय, बागपत।</p>
</div>`,
  },

  // ============================================
  // 8. डाटा ट्रांसफर CDO अनुमोदन पत्र
  // ============================================
  {
    id: 'data-transfer-cdo-approval',
    name: 'Data Transfer CDO Approval',
    nameHindi: 'डाटा ट्रांसफर CDO अनुमोदन पत्र',
    category: 'letter',
    department: 'General',
    description: 'मानव सम्पदा पोर्टल पर डाटा ट्रांसफर हेतु CDO अनुमोदन पत्र',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय मुख्य विकास अधिकारी, बागपत</strong></p>
<hr/>
<p>पत्रांक: _____/मा०सम्पदा/डा०ट्रा०/2026-27</td><td style="border:none !important; text-align:right;">दिनांक: ___/___/______</td></tr></table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"><strong>सेवा में,</strong><br/>
तकनीकी निदेशक,<br/>
मानव सम्पदा पोर्टल,<br/>
राष्ट्रीय सूचना विज्ञान केन्द्र (NIC),<br/>
उत्तर प्रदेश।</p>

<p><strong>विषय:</strong> मानव सम्पदा पोर्टल पर श्री/श्रीमती _______________ का डाटा ट्रांसफर करने के सम्बन्ध में।</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">उपरोक्त विषयक निवेदन है कि श्री/श्रीमती _______________ पद _______________ जो वर्तमान में कार्यालय _______________ में कार्यरत हैं, उनका स्थानांतरण शासनादेश/आदेश संख्या _______________ दिनांक _______________ द्वारा _______________ कार्यालय में किया गया है।</p>

<p style="text-indent:40px;">कृपया उनका डाटा मानव सम्पदा पोर्टल पर निम्नलिखित विवरण के अनुसार ट्रांसफर करने का कष्ट करें:</p>

<table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse;">
  <tr>
    <td style="width:5%;">1.</td>
    <td style="width:35%;">कर्मचारी का नाम</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>2.</td>
    <td>पद नाम</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>3.</td>
    <td>मानव सम्पदा कोड</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>4.</td>
    <td>वर्तमान कार्यालय (From)</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>5.</td>
    <td>स्थानांतरित कार्यालय (To)</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>6.</td>
    <td>स्थानांतरण आदेश संख्या</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>7.</td>
    <td>स्थानांतरण दिनांक</td>
    <td>___/___/______</td>
  </tr>
  <tr>
    <td>8.</td>
    <td>कार्यमुक्ति दिनांक</td>
    <td>___/___/______</td>
  </tr>
</table>

<p style="text-indent:40px;">कृपया उक्त कार्यवाही यथाशीघ्र कराने का कष्ट करें।</p>

<p><strong>संलग्नक:</strong> स्थानांतरण आदेश की प्रति।</p>

<p> <strong>भवदीय</strong></p>
<p style="text-align:right;">_______________ मुख्य विकास अधिकारी बागपत</p>
</div>`,
  },

  // ============================================
  // 9. आउटसोर्सिंग कम्प्यूटर ऑपरेटर नियुक्ति पत्र
  // ============================================
  {
    id: 'outsourcing-computer-operator',
    name: 'Outsourcing Computer Operator',
    nameHindi: 'आउटसोर्सिंग कम्प्यूटर ऑपरेटर नियुक्ति पत्र',
    category: 'order',
    department: 'General',
    description: 'आउटसोर्सिंग के माध्यम से कम्प्यूटर ऑपरेटर की नियुक्ति/सेवा विस्तार हेतु पत्र',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<hr/>
<p>पत्रांक: _____/आउटसोर्सिंग/2026-27</td><td style="border:none !important; text-align:right;">दिनांक: ___/___/______</td></tr></table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"><strong>सेवा में,</strong><br/>
प्रबन्ध निदेशक,<br/>
उत्तर प्रदेश आउटसोर्सिंग एजेन्सी/_______________<br/>
_______________।</p>

<p><strong>विषय:</strong> आउटसोर्सिंग के माध्यम से कम्प्यूटर ऑपरेटर की सेवायें उपलब्ध कराये जाने के सम्बन्ध में।</p>

<p><strong>सन्दर्भ:</strong> इस कार्यालय का पत्र संख्या _______________ दिनांक _______________।</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">उपरोक्त विषय एवं सन्दर्भित पत्र के क्रम में निवेदन है कि इस कार्यालय में सोशल ऑडिट/जिला विकास अभिकरण के कार्यों हेतु कम्प्यूटर ऑपरेटर की आवश्यकता है। कृपया निम्नलिखित योग्यता रखने वाले ___ (संख्या) कम्प्यूटर ऑपरेटर आउटसोर्सिंग के माध्यम से उपलब्ध कराने का कष्ट करें:</p>

<p><strong>अपेक्षित योग्यता:</strong></p>
<ol>
  <li>न्यूनतम स्नातक (B.A./B.Sc./B.Com.) या समकक्ष।</li>
  <li>CCC/O Level/NIELIT प्रमाण पत्र।</li>
  <li>हिन्दी एवं अंग्रेजी टाइपिंग (न्यूनतम 25 शब्द प्रति मिनट)।</li>
  <li>MS Office (Word, Excel, PowerPoint) का कार्यसाधक ज्ञान।</li>
  <li>सरकारी पोर्टल (PFMS, मानव सम्पदा, IGRS आदि) पर कार्य करने का अनुभव वांछनीय।</li>
</ol>

<p><strong>कार्य विवरण:</strong></p>
<ol>
  <li>सोशल ऑडिट सम्बन्धी MIS डाटा एन्ट्री।</li>
  <li>PFMS पोर्टल पर भुगतान प्रक्रिया।</li>
  <li>पत्राचार एवं टाइपिंग कार्य।</li>
  <li>विभिन्न सरकारी पोर्टल्स पर डाटा अपलोडिंग।</li>
</ol>

<p style="text-indent:40px;">कृपया यथाशीघ्र उपरोक्त व्यवस्था कराने का कष्ट करें।</p>

<p> <strong>भवदीय</strong></p>
<p style="text-align:right;">_______________ जिला विकास अधिकारी बागपत</p>
</div>`,
  },

  // ============================================
  // 10. NPS (राष्ट्रीय पेंशन योजना) DAA विवरण
  // ============================================
  {
    id: 'nps-daa-statement',
    name: 'NPS DAA Quarterly Statement',
    nameHindi: 'NPS DAA तिमाही विवरण',
    category: 'report',
    department: 'General',
    description: 'राष्ट्रीय पेंशन प्रणाली (NPS) DDO Acknowledgement Amount (DAA) तिमाही विवरण',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<p style="text-align:center;"><strong>राष्ट्रीय पेंशन प्रणाली (NPS) — DDO Acknowledgement Amount (DAA) विवरण</strong></p>
<p style="text-align:center;"><strong>तिमाही: _______________ से _______________ तक</strong></p>
<hr/>

<table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse; text-align:center;">
  <thead>
    <tr style="background-color:#f2f2f2;">
      <th style="width:5%;">क्र०सं०</th>
      <th style="width:15%;">कर्मचारी का नाम</th>
      <th style="width:12%;">PRAN नम्बर</th>
      <th style="width:10%;">पद</th>
      <th style="width:10%;">माह</th>
      <th style="width:10%;">कर्मचारी अंशदान (रु०)</th>
      <th style="width:10%;">नियोक्ता अंशदान (रु०)</th>
      <th style="width:10%;">कुल अंशदान (रु०)</th>
      <th style="width:10%;">DAA दिनांक</th>
      <th style="width:8%;">स्थिति</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>जनवरी</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>___/___/___</td>
      <td>जमा/लम्बित</td>
    </tr>
    <tr>
      <td>2</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>फरवरी</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>___/___/___</td>
      <td>जमा/लम्बित</td>
    </tr>
    <tr>
      <td>3</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>मार्च</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>___/___/___</td>
      <td>जमा/लम्बित</td>
    </tr>
  </tbody>
</table>

<p> <strong>नोट:</strong> उपरोक्त विवरण NSDL/NPS पोर्टल से प्राप्त किया गया है।</p>

<p style="text-align:right;"><strong>आहरण एवं वितरण अधिकारी (DDO)</strong><br/>
कार्यालय जिला विकास अधिकारी<br/>
बागपत</p>
</div>`,
  },

  // ============================================
  // 11. यात्रा भत्ता (TA) बिल प्रारूप
  // ============================================
  {
    id: 'ta-bill-format',
    name: 'Travel Allowance (TA) Bill',
    nameHindi: 'यात्रा भत्ता (TA) बिल',
    category: 'report',
    department: 'General',
    description: 'कर्मचारियों हेतु यात्रा भत्ता (TA/DA) बिल प्रारूप',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>यात्रा भत्ता बिल</strong></p>
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<hr/>

<table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse;">
  <tr>
    <td style="width:35%;"><strong>कर्मचारी का नाम:</strong></td>
    <td>_______________</td>
  </tr>
  <tr>
    <td><strong>पद:</strong></td>
    <td>_______________</td>
  </tr>
  <tr>
    <td><strong>वेतन स्तर/ग्रेड पे:</strong></td>
    <td>_______________</td>
  </tr>
  <tr>
    <td><strong>मुख्यालय:</strong></td>
    <td>बागपत</td>
  </tr>
  <tr>
    <td><strong>यात्रा का उद्देश्य:</strong></td>
    <td>_______________</td>
  </tr>
  <tr>
    <td><strong>स्वीकृति आदेश संख्या:</strong></td>
    <td>_______________ दिनांक ___/___/______</td>
  </tr>
</table>

<br/>
<p><strong>यात्रा विवरण:</strong></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse; text-align:center;">
  <thead>
    <tr style="background-color:#f2f2f2;">
      <th>क्र०सं०</th>
      <th>दिनांक</th>
      <th>प्रस्थान स्थान</th>
      <th>प्रस्थान समय</th>
      <th>आगमन स्थान</th>
      <th>आगमन समय</th>
      <th>यात्रा साधन</th>
      <th>किराया (रु०)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>___/___/___</td>
      <td>_______________</td>
      <td>___:___ बजे</td>
      <td>_______________</td>
      <td>___:___ बजे</td>
      <td>बस/रेल/निजी</td>
      <td>_______________</td>
    </tr>
    <tr>
      <td>2</td>
      <td>___/___/___</td>
      <td>_______________</td>
      <td>___:___ बजे</td>
      <td>_______________</td>
      <td>___:___ बजे</td>
      <td>बस/रेल/निजी</td>
      <td>_______________</td>
    </tr>
  </tbody>
</table>

<br/>
<table border="1" cellpadding="6" cellspacing="0" style="width:60%; border-collapse:collapse;">
  <tr>
    <td><strong>कुल किराया:</strong></td>
    <td>रु० _______________</td>
  </tr>
  <tr>
    <td><strong>दैनिक भत्ता (DA):</strong></td>
    <td>रु० _______________ × ___ दिन = रु० _______________</td>
  </tr>
  <tr>
    <td><strong>कुल देय राशि:</strong></td>
    <td><strong>रु० _______________</strong></td>
  </tr>
</table>

<p> <strong>प्रमाणित किया जाता है कि:</strong></p>
<ol>
  <li>उपरोक्त यात्रा शासकीय कार्य हेतु की गयी है।</li>
  <li>यात्रा के दौरान सबसे छोटा मार्ग अपनाया गया है।</li>
  <li>कोई अग्रिम धनराशि प्राप्त नहीं की गयी है / रु० _______________ अग्रिम प्राप्त किया गया है।</li>
</ol>

<p><strong>कर्मचारी के हस्ताक्षर</strong> दिनांक: ___/___/______</td><td style="border:none !important; text-align:right;"><strong>नियंत्रक अधिकारी के हस्ताक्षर</strong> दिनांक: ___/___/______</td></tr></table>
</div>`,
  },

  // ============================================
  // 12. मानव सम्पदा डाटा अपडेट पत्र
  // ============================================
  {
    id: 'manav-sampada-update',
    name: 'Manav Sampada Data Update',
    nameHindi: 'मानव सम्पदा डाटा अपडेट पत्र',
    category: 'letter',
    department: 'General',
    description: 'मानव सम्पदा पोर्टल पर कर्मचारी डाटा अपडेट/सुधार हेतु पत्र',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<hr/>
<p>पत्रांक: _____/मा०सम्पदा/2026-27</td><td style="border:none !important; text-align:right;">दिनांक: ___/___/______</td></tr></table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"><strong>सेवा में,</strong><br/>
जिला सूचना विज्ञान अधिकारी,<br/>
राष्ट्रीय सूचना विज्ञान केन्द्र (NIC),<br/>
बागपत।</p>

<p><strong>विषय:</strong> मानव सम्पदा पोर्टल पर कर्मचारियों के डाटा अपडेट/सुधार करने के सम्बन्ध में।</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">उपरोक्त विषयक निवेदन है कि इस कार्यालय के अधीन कार्यरत निम्नलिखित कर्मचारियों का डाटा मानव सम्पदा पोर्टल पर अपडेट/सुधार करने की आवश्यकता है। कृपया निम्नलिखित विवरण के अनुसार कार्यवाही करने का कष्ट करें:</p>

<table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse;">
  <thead>
    <tr style="background-color:#f2f2f2;">
      <th style="width:5%;">क्र०सं०</th>
      <th style="width:15%;">कर्मचारी का नाम</th>
      <th style="width:12%;">मा०सम्पदा कोड</th>
      <th style="width:10%;">पद</th>
      <th style="width:20%;">सुधार किया जाना (वर्तमान)</th>
      <th style="width:20%;">सही विवरण</th>
      <th style="width:18%;">संलग्न प्रमाण</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
    </tr>
    <tr>
      <td>2</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
    </tr>
  </tbody>
</table>

<p style="text-indent:40px;">कृपया यथाशीघ्र कार्यवाही कराने का कष्ट करें।</p>

<p><strong>संलग्नक:</strong> सम्बन्धित प्रमाण पत्र की प्रतियाँ।</p>

<p> <strong>भवदीय</strong></p>
<p style="text-align:right;">_______________ जिला विकास अधिकारी बागपत</p>
</div>`,
  },

  // ============================================
  // 13. बजट आवंटन हेतु लम्बित स्वीकृति विवरण
  // ============================================
  {
    id: 'budget-allocation-pending',
    name: 'Budget Allocation Pending Approvals',
    nameHindi: 'बजट आवंटन लम्बित स्वीकृति विवरण',
    category: 'report',
    department: 'General',
    description: 'मानक मद अन्तर्गत बजट आवंटन हेतु लम्बित स्वीकृतियों का विवरण (चिकित्सा व्यय आदि)',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<p style="text-align:center;"><strong>मानक मद 49 — चिकित्सा व्यय अन्तर्गत बजट आवंटन हेतु लम्बित स्वीकृतियों का विवरण</strong></p>
<hr/>

<table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse; text-align:center;">
  <thead>
    <tr style="background-color:#f2f2f2;">
      <th style="width:5%;">क्र०सं०</th>
      <th style="width:15%;">कर्मचारी/अधिकारी का नाम</th>
      <th style="width:10%;">पद</th>
      <th style="width:12%;">कार्यालय</th>
      <th style="width:12%;">चिकित्सा व्यय राशि (रु०)</th>
      <th style="width:12%;">स्वीकृति पत्र संख्या/दिनांक</th>
      <th style="width:10%;">बजट शीर्ष</th>
      <th style="width:12%;">लम्बित कारण</th>
      <th style="width:12%;">अभ्युक्ति</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
    </tr>
    <tr>
      <td>2</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
    </tr>
    <tr>
      <td>3</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
    </tr>
  </tbody>
  <tfoot>
    <tr style="background-color:#f9f9f9;">
      <td colspan="4"><strong>कुल योग</strong></td>
      <td><strong>रु० _______________</strong></td>
      <td colspan="4"></td>
    </tr>
  </tfoot>
</table>

<p> <strong>नोट:</strong> उपरोक्त समस्त स्वीकृतियाँ बजट उपलब्धता के अनुसार लम्बित हैं। बजट आवंटन प्राप्त होने पर तत्काल भुगतान कराया जायेगा।</p>

<p style="text-align:right;"><strong>जिला विकास अधिकारी</strong><br/>
बागपत</p>
</div>`,
  },

  // ============================================
  // 14. CDO अवकाश आवेदन पत्र
  // ============================================
  {
    id: 'cdo-leave-application',
    name: 'CDO Leave Application',
    nameHindi: 'CDO अवकाश आवेदन पत्र',
    category: 'letter',
    department: 'General',
    description: 'मुख्य विकास अधिकारी हेतु अवकाश/छुट्टी आवेदन पत्र',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>अवकाश आवेदन पत्र</strong></p>
<hr/>

<p style="text-align:right;">दिनांक: ___/___/______</p>

<p><strong>सेवा में,</strong><br/>
जिलाधिकारी,<br/>
बागपत।</p>

<p><strong>विषय:</strong> _______________ अवकाश स्वीकृत किये जाने के सम्बन्ध में।</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">सविनय निवेदन है कि मैं _______________ पद _______________ इस कार्यालय में कार्यरत हूँ। मुझे _______________ (कारण) के कारण दिनांक ___/___/______ से ___/___/______ तक कुल ___ दिवस का _______________ (अर्जित अवकाश/आकस्मिक अवकाश/चिकित्सा अवकाश) चाहिए।</p>

<p style="text-indent:40px;">मेरी अनुपस्थिति में कार्यालय का समस्त कार्यभार श्री/श्रीमती _______________ पद _______________ को सौंपा जायेगा।</p>

<p><strong>अवकाश विवरण:</strong></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:80%; border-collapse:collapse;">
  <tr>
    <td style="width:40%;">अवकाश का प्रकार</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>अवकाश प्रारम्भ दिनांक</td>
    <td>___/___/______</td>
  </tr>
  <tr>
    <td>अवकाश समाप्ति दिनांक</td>
    <td>___/___/______</td>
  </tr>
  <tr>
    <td>कुल दिवस</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>कारण</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>अवकाश अवधि में पता</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>सम्पर्क दूरभाष</td>
    <td>_______________</td>
  </tr>
</table>

<p style="text-indent:40px;">अतः श्रीमान से विनम्र निवेदन है कि कृपया मुझे उपरोक्तानुसार अवकाश स्वीकृत करने की कृपा करें।</p>

<p style="text-align:right;"> <strong>प्रार्थी</strong><br/>
_______________<br/>
(नाम एवं पद)<br/>
कार्यालय _______________</p>

<hr/>
<p><strong>नियंत्रक अधिकारी की टिप्पणी:</strong></p>
<p>_______________</p>
<p>हस्ताक्षर: _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;दिनांक: ___/___/______</p>
</div>`,
  },

  // ============================================
  // 15. DSAC भूमि विवरण (Land Statement)
  // ============================================
  {
    id: 'dsac-land-statement',
    name: 'DSAC Land Statement',
    nameHindi: 'DSAC भूमि विवरण पत्र',
    category: 'report',
    department: 'Rural Development',
    description: 'DSAC (जिला सामाजिक अंकेक्षण समिति) भूमि सम्बन्धी विवरण/स्थिति पत्र',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<p style="text-align:center;"><strong>जिला सामाजिक अंकेक्षण समिति (DSAC) — भूमि सम्बन्धी विवरण</strong></p>
<hr/>

<p><strong>विषय:</strong> DSAC कार्यालय/भवन/भूमि की वर्तमान स्थिति का विवरण।</p>

<table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse;">
  <tr>
    <td style="width:5%;">1.</td>
    <td style="width:35%;">DSAC कार्यालय का पता</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>2.</td>
    <td>भूमि का क्षेत्रफल</td>
    <td>_______________ वर्ग मीटर</td>
  </tr>
  <tr>
    <td>3.</td>
    <td>भूमि का स्वामित्व</td>
    <td>सरकारी / पंचायत / किराये पर</td>
  </tr>
  <tr>
    <td>4.</td>
    <td>खसरा/गाटा संख्या</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>5.</td>
    <td>भवन निर्माण की स्थिति</td>
    <td>निर्मित / अनिर्मित / प्रस्तावित</td>
  </tr>
  <tr>
    <td>6.</td>
    <td>भवन का क्षेत्रफल (यदि निर्मित)</td>
    <td>_______________ वर्ग मीटर</td>
  </tr>
  <tr>
    <td>7.</td>
    <td>कक्षों की संख्या</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>8.</td>
    <td>वर्तमान उपयोग</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>9.</td>
    <td>मरम्मत/नवीनीकरण की आवश्यकता</td>
    <td>हाँ / नहीं — _______________</td>
  </tr>
  <tr>
    <td>10.</td>
    <td>अनुमानित लागत (यदि नवीनीकरण आवश्यक)</td>
    <td>रु० _______________</td>
  </tr>
</table>

<p> <strong>नोट:</strong> उपरोक्त विवरण तहसील/राजस्व अभिलेखों से सत्यापित है।</p>

<p style="text-align:right;"><strong>जिला विकास अधिकारी</strong><br/>
बागपत</p>
</div>`,
  },

  // ============================================
  // 16. खण्ड विकास अधिकारी को आख्या पत्र
  // ============================================
  {
    id: 'bdo-report-letter',
    name: 'BDO Report/Investigation Letter',
    nameHindi: 'खण्ड विकास अधिकारी आख्या पत्र',
    category: 'report',
    department: 'Block Office',
    description: 'खण्ड विकास अधिकारी से प्राप्त जाँच आख्या / रिपोर्ट प्रेषण हेतु पत्र',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p><strong>प्रेषक,</strong><br/>
खण्ड विकास अधिकारी,<br/>
विकास खण्ड _______________<br/>
जनपद बागपत।</p>

<p><strong>सेवा में,</strong><br/>
जिला विकास अधिकारी,<br/>
बागपत।</p>

<p>पत्रांक: _____/वि०ख०/___/2026-27</td><td style="border:none !important; text-align:right;">दिनांक: ___/___/______</td></tr></table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"><strong>विषय:</strong> _______________ के सम्बन्ध में जाँच आख्या प्रेषण।</p>

<p><strong>सन्दर्भ:</strong> आपके कार्यालय पत्र संख्या _______________ दिनांक _______________।</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">कृपया उपरोक्त विषय एवं सन्दर्भित पत्र के क्रम में जाँच आख्या निम्नानुसार प्रेषित की जाती है:</p>

<p style="text-indent:40px;">सन्दर्भित पत्र के अनुसार श्री/श्रीमती _______________ निवासी ग्राम _______________ विकास खण्ड _______________ द्वारा _______________ के विषय में शिकायत/आवेदन प्राप्त हुआ था।</p>

<p style="text-indent:40px;">उक्त शिकायत/प्रकरण की जाँच ग्राम स्तर पर करायी गयी। जाँच में निम्न तथ्य सामने आये हैं:</p>

<ol>
  <li>_______________</li>
  <li>_______________</li>
  <li>_______________</li>
</ol>

<p style="text-indent:40px;">उपरोक्त जाँच के आधार पर यह पाया गया कि _______________। अतः शिकायतकर्ता को _______________ हेतु पात्र/अपात्र पाया गया है। शिकायतकर्ता को दूरभाष/लिखित रूप से अवगत करा दिया गया है।</p>

<p><strong>संलग्नक:</strong> जाँच आख्या की प्रति।</p>

<p> <strong>भवदीय</strong></p>
<p style="text-align:right;">_______________ खण्ड विकास अधिकारी विकास खण्ड _______________ जनपद बागपत</p>
</div>`,
  },

  // ============================================
  // 17. अनुलग्नक (Annex) — सोशल ऑडिट प्रपत्र 3
  // ============================================
  {
    id: 'annex-3-social-audit',
    name: 'Annex-3: Social Audit Findings',
    nameHindi: 'अनुलग्नक-3: सोशल ऑडिट जाँच निष्कर्ष',
    category: 'report',
    department: 'Social Audit',
    description: 'सोशल ऑडिट अनुलग्नक-3 — योजनावार जाँच निष्कर्ष एवं चिन्हित बिन्दु',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>अनुलग्नक-3</strong></p>
<p style="text-align:center;"><strong>सामाजिक अंकेक्षण — जाँच निष्कर्ष एवं चिन्हित बिन्दु</strong></p>
<hr/>

<p><strong>ग्राम पंचायत:</strong> _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>विकास खण्ड:</strong> _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>जनपद:</strong> बागपत</p>
<p><strong>अंकेक्षण अवधि:</strong> दिनांक _______________ से _______________ तक</p>
<p><strong>सामाजिक अंकेक्षण दल:</strong> _______________</p>

<br/>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse; text-align:left;">
  <thead>
    <tr style="background-color:#f2f2f2;">
      <th style="width:5%;">क्र०सं०</th>
      <th style="width:12%;">योजना का नाम</th>
      <th style="width:10%;">लाभार्थी का नाम</th>
      <th style="width:10%;">पिता/पति का नाम</th>
      <th style="width:20%;">चिन्हित बिन्दु/विसंगति</th>
      <th style="width:15%;">शासकीय अभिलेख में दर्ज राशि (रु०)</th>
      <th style="width:15%;">वास्तविक राशि/स्थिति</th>
      <th style="width:13%;">अन्तर/टिप्पणी</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>मनरेगा</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>जॉब कार्ड में 100 दिवस दर्शित परन्तु लाभार्थी ने कार्य न करने की पुष्टि की।</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
    </tr>
    <tr>
      <td>2</td>
      <td>PMAY-G</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>आवास निर्माण अपूर्ण दर्शित परन्तु पूर्ण धनराशि का भुगतान किया गया।</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
    </tr>
    <tr>
      <td>3</td>
      <td>NSAP (वृद्धा पेंशन)</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>पेंशन लाभार्थी मृत पाये गये, पेंशन जारी।</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
    </tr>
    <tr>
      <td>4</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
    </tr>
  </tbody>
</table>

<p> <strong>सामाजिक अंकेक्षण दल के सदस्यों के हस्ताक्षर:</strong></p>
<p>1. _______________</td><td style="border:none !important; text-align:right;">2. _______________</td>
  </tr>
  <tr>
    <td style="border:none;">3. _______________</td>
    <td style="border:none;">4. _______________</td></tr></table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"> <strong>दिनांक:</strong> ___/___/______</p>
</div>`,
  },

  // ============================================
  // 18. अनुलग्नक (Annex) — सोशल ऑडिट प्रपत्र 4
  // ============================================
  {
    id: 'annex-4-social-audit',
    name: 'Annex-4: Social Audit ATR Format',
    nameHindi: 'अनुलग्नक-4: सोशल ऑडिट ATR प्रपत्र',
    category: 'report',
    department: 'Social Audit',
    description: 'सोशल ऑडिट अनुलग्नक-4 — कार्यवाही रिपोर्ट (ATR) प्रपत्र',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>अनुलग्नक-4</strong></p>
<p style="text-align:center;"><strong>कार्यवाही रिपोर्ट (Action Taken Report — ATR)</strong></p>
<hr/>

<p><strong>ग्राम पंचायत:</strong> _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>विकास खण्ड:</strong> _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>जनपद:</strong> बागपत</p>
<p><strong>सामाजिक अंकेक्षण दिनांक:</strong> _______________ से _______________</p>
<p><strong>ग्राम सभा दिनांक:</strong> _______________</p>

<br/>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse; text-align:left;">
  <thead>
    <tr style="background-color:#f2f2f2;">
      <th style="width:5%;">क्र०सं०</th>
      <th style="width:10%;">योजना</th>
      <th style="width:20%;">चिन्हित बिन्दु/विसंगति</th>
      <th style="width:12%;">सम्बन्धित अधिकारी/कर्मचारी</th>
      <th style="width:20%;">की गयी कार्यवाही</th>
      <th style="width:10%;">धनराशि वसूली (यदि लागू)</th>
      <th style="width:10%;">कार्यवाही दिनांक</th>
      <th style="width:13%;">वर्तमान स्थिति</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>मनरेगा</td>
      <td>फर्जी मस्टर रोल में नाम दर्ज।</td>
      <td>ग्राम रोजगार सहायक</td>
      <td>सम्बन्धित ग्राम रोजगार सहायक को स्पष्टीकरण हेतु नोटिस जारी किया गया।</td>
      <td>रु० _______________</td>
      <td>___/___/___</td>
      <td>जाँच प्रगति पर / पूर्ण</td>
    </tr>
    <tr>
      <td>2</td>
      <td>PMAY-G</td>
      <td>अपूर्ण आवास में पूर्ण भुगतान।</td>
      <td>सचिव/ग्राम प्रधान</td>
      <td>शेष निर्माण कार्य पूर्ण कराया गया एवं फोटोग्राफिक साक्ष्य प्राप्त किये गये।</td>
      <td>—</td>
      <td>___/___/___</td>
      <td>पूर्ण</td>
    </tr>
    <tr>
      <td>3</td>
      <td>NSAP</td>
      <td>मृत लाभार्थी को पेंशन जारी।</td>
      <td>सचिव</td>
      <td>मृत लाभार्थी की पेंशन तत्काल बन्द कर दी गयी। अवैध भुगतान की वसूली कार्यवाही प्रारम्भ।</td>
      <td>रु० _______________</td>
      <td>___/___/___</td>
      <td>वसूली प्रगति पर</td>
    </tr>
    <tr>
      <td>4</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>___/___/___</td>
      <td>_______________</td>
    </tr>
  </tbody>
</table>

<p> <strong>सारांश:</strong></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:60%; border-collapse:collapse;">
  <tr>
    <td>कुल चिन्हित बिन्दु</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>निस्तारित बिन्दु</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>लम्बित बिन्दु</td>
    <td>_______________</td>
  </tr>
  <tr>
    <td>कुल वसूली राशि</td>
    <td>रु० _______________</td>
  </tr>
</table>

<p style="text-align:right;"> <strong>जिला विकास अधिकारी</strong><br/>
बागपत</p>
</div>`,
  },

  // ============================================
  // 19. सोशल ऑडिट वार्षिक लेखा प्रपत्र
  // ============================================
  {
    id: 'annual-audit-report',
    name: 'Annual Audit Report (2011-15 Format)',
    nameHindi: 'वार्षिक लेखा परीक्षा प्रपत्र',
    category: 'report',
    department: 'Social Audit',
    description: 'वार्षिक लेखा परीक्षा (ऑडिट) अप्ति प्रपत्र — सरकारी प्रारूप',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<p style="text-align:center;"><strong>वार्षिक लेखा परीक्षा प्रतिवेदन</strong></p>
<p style="text-align:center;"><strong>वित्तीय वर्ष: _______________ से _______________</strong></p>
<hr/>

<p><strong>1. कार्यालय का नाम:</strong> कार्यालय जिला विकास अधिकारी, बागपत</p>
<p><strong>2. DDO कोड:</strong> _______________</p>
<p><strong>3. कोषागार:</strong> _______________</p>

<p><strong>4. प्राप्तियां एवं व्यय का सारांश:</strong></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse; text-align:center;">
  <thead>
    <tr style="background-color:#f2f2f2;">
      <th>विवरण</th>
      <th>बजट आवंटन (रु०)</th>
      <th>व्यय (रु०)</th>
      <th>बचत (रु०)</th>
      <th>प्रतिशत उपयोग</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>वेतन</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>___%</td>
    </tr>
    <tr>
      <td>यात्रा भत्ता</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>___%</td>
    </tr>
    <tr>
      <td>कार्यालय व्यय</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>___%</td>
    </tr>
    <tr>
      <td>चिकित्सा व्यय</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>___%</td>
    </tr>
    <tr style="background-color:#f9f9f9;">
      <td><strong>कुल योग</strong></td>
      <td><strong>_______________</strong></td>
      <td><strong>_______________</strong></td>
      <td><strong>_______________</strong></td>
      <td><strong>___%</strong></td>
    </tr>
  </tbody>
</table>

<p><strong>5. लेखा परीक्षा में चिन्हित प्रमुख बिन्दु:</strong></p>
<ol>
  <li>_______________</li>
  <li>_______________</li>
  <li>_______________</li>
</ol>

<p><strong>6. पूर्व लेखा परीक्षा पैरा निस्तारण स्थिति:</strong></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse;">
  <thead>
    <tr style="background-color:#f2f2f2;">
      <th>पैरा संख्या</th>
      <th>विषय</th>
      <th>राशि (रु०)</th>
      <th>निस्तारण स्थिति</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>___</td>
      <td>_______________</td>
      <td>_______________</td>
      <td>निस्तारित / लम्बित</td>
    </tr>
  </tbody>
</table>

<p> <strong>प्रमाणित किया जाता है कि उपरोक्त विवरण सही एवं पूर्ण है।</strong></p>

<p style="text-align:right;"><strong>जिला विकास अधिकारी</strong><br/>
बागपत</p>
</div>`,
  },

  // ============================================
  // 20. सामान्य पत्र प्रारूप (Draft Letter)
  // ============================================
  {
    id: 'general-draft-praroop',
    name: 'General Draft / Praroop',
    nameHindi: 'सामान्य पत्र प्रारूप',
    category: 'letter',
    department: 'General',
    description: 'सामान्य सरकारी पत्र प्रारूप — अधिकारी स्तर का मानक ड्राफ्ट',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p><strong>प्रेषक,</strong><br/>
_______________,<br/>
(पदनाम)<br/>
कार्यालय _______________<br/>
_______________।</p>

<p><strong>सेवा में,</strong><br/>
_______________,<br/>
(पदनाम)<br/>
_______________।</p>

<p>पत्रांक: _____/___/2026-27</td><td style="border:none !important; text-align:right;">दिनांक: ___/___/______</td></tr></table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"><strong>विषय:</strong> _______________ के सम्बन्ध में।</p>

<p><strong>सन्दर्भ:</strong> 1. शासनादेश संख्या _______________ दिनांक _______________<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2. इस कार्यालय का पत्र संख्या _______________ दिनांक _______________</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">उपरोक्त विषय एवं सन्दर्भित पत्रों के क्रम में सादर निवेदन है कि _______________।</p>

<p style="text-indent:40px;">_______________</p>

<p style="text-indent:40px;">अतः श्रीमान से विनम्र अनुरोध है कि कृपया _______________। इस सम्बन्ध में आवश्यक कार्यवाही कराने का कष्ट करें।</p>

<p><strong>संलग्नक:</strong> उपरोक्तानुसार।</p>

<p> <strong>भवदीय</strong></p>
<p style="text-align:right;">_______________ (नाम) (पदनाम)</p>

<p><strong>प्रतिलिपि :-</strong><br/>
1. _______________ की सेवा में सादर सूचनार्थ प्रेषित।<br/>
2. _______________ की सेवा में आवश्यक कार्यवाही हेतु प्रेषित।</p>
</div>`,
  },

  // ============================================
  // 21. आख्या प्रेषण पत्र
  // ============================================
  {
    id: 'report-dispatch',
    name: 'Report Dispatch Letter',
    nameHindi: 'आख्या प्रेषण पत्र',
    category: 'report',
    department: 'General',
    description: 'जाँच आख्या प्रेषण हेतु मानक पत्र',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय _______________</strong></p>
<hr/>
<p>पत्र संख्या: _____ / _____</td><td style="border:none !important; text-align:right;">दिनांक: ___/___/______</td></tr></table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"><strong>सेवा में,</strong></p>
<p>_______________ _______________</p>

<p><strong>विषय:</strong> आख्या प्रेषण के संबंध में।</p>

<p><strong>सन्दर्भ:</strong> आपके कार्यालय पत्र संख्या _______________ दिनांक _______________।</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">उपरोक्त विषयांतर्गत एवं सन्दर्भित पत्र के क्रम में निवेदन है कि संदर्भित प्रकरण की जांच कर आख्या निम्नानुसार प्रेषित की जाती है:</p>

<p style="text-indent:40px;">_______________</p>

<p style="text-indent:40px;">जाँच में पाया गया कि _______________। उक्त के विषय में सम्बन्धित व्यक्ति/अधिकारी को अवगत करा दिया गया है।</p>

<p><strong>संलग्नक:</strong> जाँच आख्या।</p>

<p> <strong>भवदीय</strong></p>
<p style="text-align:right;">_______________ (नाम) (पदनाम)</p>
</div>`,
  },

  // ============================================
  // 22. कार्यालय आदेश
  // ============================================
  {
    id: 'office-order',
    name: 'Office Order',
    nameHindi: 'कार्यालय आदेश',
    category: 'order',
    department: 'General',
    description: 'मानक कार्यालय आदेश प्रारूप',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<p style="text-align:center;"><strong>कार्यालय आदेश</strong></p>
<hr/>
<p>आदेश संख्या: _____ / _____</td><td style="border:none !important; text-align:right;">दिनांक: ___/___/______</td></tr></table>

<p style="text-indent:40px;">_______________</p>

<p style="text-indent:40px;">यह आदेश तत्काल प्रभाव से लागू होगा। सम्बन्धित अधिकारी/कर्मचारी इसका अनुपालन सुनिश्चित करें।</p>

<p style="text-indent:40px;">उक्त के अतिरिक्त यह भी निर्देशित किया जाता है कि _______________।</p>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"> <strong>आदेशानुसार</strong></p>
<p style="text-align:right;">_______________ (नाम) जिला विकास अधिकारी बागपत</p>

<p><strong>प्रतिलिपि :-</strong><br/>
1. सम्बन्धित अधिकारी/कर्मचारी को सूचनार्थ एवं आवश्यक कार्यवाही हेतु।<br/>
2. कार्यालय नोटिस बोर्ड पर चस्पा हेतु।</p>
</div>`,
  },

  // ============================================
  // 23. ग्राम पंचायत पत्र
  // ============================================
  {
    id: 'gram-panchayat-letter',
    name: 'Gram Panchayat Letter',
    nameHindi: 'ग्राम पंचायत पत्र',
    category: 'letter',
    department: 'Panchayat',
    description: 'ग्राम पंचायत से सम्बन्धित मानक पत्र',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय ग्राम पंचायत _______________</strong></p>
<p style="text-align:center;">विकास खण्ड: _______________&nbsp;&nbsp;जनपद: बागपत</p>
<hr/>
<p>पत्र संख्या: _____ / _____</td><td style="border:none !important; text-align:right;">दिनांक: ___/___/______</td></tr></table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"><strong>सेवा में,</strong></p>
<p>खण्ड विकास अधिकारी विकास खण्ड _______________ जनपद बागपत</p>

<p><strong>विषय:</strong> _______________।</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">सविनय निवेदन है कि ग्राम पंचायत _______________ विकास खण्ड _______________ में _______________ के सम्बन्ध में आपका ध्यान आकर्षित किया जाता है।</p>

<p style="text-indent:40px;">_______________</p>

<p style="text-indent:40px;">अतः श्रीमान से विनम्र अनुरोध है कि कृपया उक्त विषय में आवश्यक कार्यवाही कराने का कष्ट करें।</p>

<p> <strong>भवदीय</strong></p>
<p style="text-align:right;">_______________ ग्राम प्रधान ग्राम पंचायत _______________</p>
</div>`,
  },

  // ============================================
  // 24. नोटशीट
  // ============================================
  {
    id: 'notesheet',
    name: 'Note Sheet',
    nameHindi: 'नोटशीट',
    category: 'notesheet',
    department: 'General',
    description: 'कार्यालयीन नोटशीट — आन्तरिक टिप्पणी प्रारूप',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>नोटशीट</strong></p>
<hr/>
<p><strong>पत्रावली संख्या:</strong> _______________</p>
<p><strong>विषय:</strong> _______________</p>
<p><strong>दिनांक:</strong> ___/___/______</p>

<p> <strong>टिप्पणी:</strong></p>

<p style="text-indent:40px;">कृपया उपरोक्त विषयक पत्रावली का अवलोकन करें। _______________ के सम्बन्ध में निम्नलिखित तथ्य प्रस्तुत हैं:</p>

<ol>
  <li>_______________</li>
  <li>_______________</li>
  <li>_______________</li>
</ol>

<p> <strong>प्रस्ताव:</strong></p>

<p style="text-indent:40px;">उपरोक्त तथ्यों के आलोक में यह प्रस्तावित है कि _______________। कृपया अनुमोदन/आदेश प्रदान करने का कष्ट करें।</p>

<p> _______________ (अधिकारी का नाम एवं पदनाम)</p>

<hr/>
<p><strong>वरिष्ठ अधिकारी की टिप्पणी:</strong></p>
<p>_______________</p>
<p>हस्ताक्षर: _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;दिनांक: ___/___/______</p>
</div>`,
  },

  // ============================================
  // 25. स्मरण पत्र (Reminder)
  // ============================================
  {
    id: 'reminder-letter',
    name: 'Reminder Letter',
    nameHindi: 'स्मरण पत्र',
    category: 'reminder',
    department: 'General',
    description: 'लम्बित कार्यवाही हेतु स्मरण/अनुस्मारक पत्र',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:center;"><strong>कार्यालय जिला विकास अधिकारी, बागपत</strong></p>
<p style="text-align:center;"><strong>स्मरण पत्र (प्रथम/द्वितीय/अन्तिम)</strong></p>
<hr/>
<p>पत्र संख्या: _____ / _____</td><td style="border:none !important; text-align:right;">दिनांक: ___/___/______</td></tr></table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"><strong>सेवा में,</strong></p>
<p>_______________ _______________</p>

<p><strong>विषय:</strong> _______________।</p>

<p><strong>सन्दर्भ:</strong> इस कार्यालय का पत्र संख्या _______________ दिनांक _______________।</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">उपरोक्त विषय एवं संदर्भित पत्र के क्रम में स्मरण कराना है कि अभी तक आपकी ओर से कोई कार्यवाही/उत्तर प्राप्त नहीं हुआ है। उक्त विषय में यथाशीघ्र कार्यवाही अपेक्षित थी, जिसमें अनावश्यक विलम्ब हो रहा है।</p>

<p style="text-indent:40px;">कृपया सन्दर्भित पत्र के अनुसार शीघ्रातिशीघ्र आवश्यक कार्यवाही कर इस कार्यालय को अवगत करायें। विलम्ब के लिए आप स्वयं उत्तरदायी होंगे।</p>

<p style="text-indent:40px;">कृपया यथाशीघ्र ___ दिवस के अन्दर अनुपालन सुनिश्चित करें।</p>

<p> <strong>भवदीय</strong></p>
<p style="text-align:right;">_______________ जिला विकास अधिकारी बागपत</p>
</div>`,
  },

  // ============================================
  // 26. IGRS शिकायत उत्तर
  // ============================================
  {
    id: 'igrs-reply',
    name: 'IGRS Complaint Reply',
    nameHindi: 'IGRS शिकायत निस्तारण उत्तर',
    category: 'reply',
    department: 'IGRS',
    description: 'IGRS शिकायत निस्तारण — UP सरकार प्रारूप',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p><strong>प्रेषक,</strong><br/>
परियोजना निदेशक,<br/>
जिला ग्राम्य विकास अभिकरण<br/>
बागपत।</p>

<p><strong>सेवा में,</strong><br/>
जिलाधिकारी,<br/>
बागपत।</p>

<p>पत्रांक &nbsp;&nbsp;&nbsp;/जी०सी०/सि०/2026-27</td><td style="border:none !important; text-align:right;">दिनांक &nbsp;&nbsp;&nbsp;</td></tr></table>

<table style="width:100%; border:none !important; margin:10px 0;"><tr><td style="border:none !important;"><strong>विषय &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;आई०जी०आर०एस० पोर्टल पर प्राप्त शिकायत संख्या _______________ दिनांक _______________ का निस्तारण किये जाने के सम्बन्ध में।</strong></p>

<p>महोदय,</p>

<p style="text-indent:40px;">कृपया उपरोक्त विषयक आई०जी०आर०एस० पोर्टल पर प्राप्त शिकायत संख्या _______________ का अवलोकन करने का कष्ट करें, जिसके द्वारा श्री/श्रीमती _______________ निवासी _______________ जनपद बागपत द्वारा _______________ की माँग की जा रही है।</p>

<p style="text-indent:40px;">उक्त शिकायत की जाँच खण्ड विकास अधिकारी _______________ द्वारा करायी गयी। उन्होंने अपने कार्यालय पत्रांक _______________ दिनांक _______________ के द्वारा अपनी जाँच आख्या में अवगत कराया है कि _______________। उक्त के विषय में आवेदक को उनके दूरभाष पर भी अवगत कराया जा चुका है। और वह सन्तुष्ट हैं।</p>

<p>अतः शिकायत को निस्तारित करने का कष्ट करें।</p>

<p>सलग्न जाँच आख्या।</p>

<p style="text-align:right;">परियोजना निदेशक,<br/>
जिला ग्राम्य विकास अभिकरण<br/>
बागपत।</p>

<p><strong>प्रतिलिपि :-</strong> मुख्य विकास अधिकारी महोदय, बागपत की सेवा में सादर सूचनार्थ प्रेषित।</p>

<p style="text-align:right;">परियोजना निदेशक,<br/>
जिला ग्राम्य विकास अभिकरण<br/>
बागपत।</p>
</div>`,
  },

  // ============================================
  // 27. सामान्य आवेदन पत्र
  // ============================================
  {
    id: 'general-application',
    name: 'General Application',
    nameHindi: 'सामान्य आवेदन पत्र',
    category: 'letter',
    department: 'General',
    description: 'सामान्य आवेदन पत्र — किसी भी अधिकारी को प्रेषित',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p style="text-align:right;">दिनांक: ___/___/______</p>

<p><strong>सेवा में,</strong></p>
<p>_______________ _______________ _______________</p>

<p><strong>विषय:</strong> _______________।</p>

<p><strong>महोदय,</strong></p>

<p style="text-indent:40px;">सविनय निवेदन है कि मैं _______________ पुत्र/पुत्री/पत्नी श्री _______________ निवासी _______________ जनपद बागपत, _______________।</p>

<p style="text-indent:40px;">_______________</p>

<p style="text-indent:40px;">अतः श्रीमान से विनम्र निवेदन है कि कृपया _______________। आपकी अति कृपा होगी।</p>

<p style="text-align:right;"> <strong>प्रार्थी</strong></p>
<p style="text-align:right;">_______________ (नाम) (पता) मोबाइल: _______________</p>
</div>`,
  },

  // ============================================
  // 28. DRDA/IGRS शिकायत पत्र (जेनेरिक)
  // ============================================
  {
    id: 'drda-letter',
    name: 'DRDA Generic Letter',
    nameHindi: 'DRDA सामान्य पत्र',
    category: 'letter',
    department: 'DRDA',
    description: 'DRDA कार्यालय का सामान्य पत्राचार प्रारूप',
    content: `<div style="font-family:'Noto Sans Devanagari',Arial; font-size:14px; line-height:2; padding:30px;">
<p><strong>प्रेषक,</strong><br/>
परियोजना निदेशक,<br/>
जिला ग्राम्य विकास अभिकरण<br/>
बागपत।</p>

<p><strong>सेवा में,</strong><br/>
_______________,<br/>
_______________।</p>

<p>पत्रांक &nbsp;&nbsp;&nbsp;/जी०सी०/___/2026-27</td><td style="border:none !important; text-align:right;">दिनांक &nbsp;&nbsp;&nbsp;</td></tr></table>

<p><strong>विषय:</strong> _______________।</p>

<p><strong>सन्दर्भ:</strong> _______________।</p>

<p>महोदय,</p>

<p style="text-indent:40px;">उपरोक्त विषय एवं सन्दर्भित पत्र के क्रम में निवेदन है कि _______________।</p>

<p style="text-indent:40px;">_______________</p>

<p style="text-indent:40px;">कृपया उक्त विषय में आवश्यक कार्यवाही कराने का कष्ट करें।</p>

<p><strong>संलग्नक:</strong> _______________।</p>

<p style="text-align:right;">परियोजना निदेशक,<br/>
जिला ग्राम्य विकास अभिकरण<br/>
बागपत।</p>

<p><strong>प्रतिलिपि :-</strong><br/>
1. मुख्य विकास अधिकारी महोदय, बागपत की सेवा में सादर सूचनार्थ प्रेषित।<br/>
2. _______________।</p>
</div>`,
  },
];

export function getTemplatesByCategory(category: string): Template[] {
  return governmentTemplates.filter(t => t.category === category);
}

export function getTemplatesByDepartment(department: string): Template[] {
  return governmentTemplates.filter(t => t.department === department);
}
