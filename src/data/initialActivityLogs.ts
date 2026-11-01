import { SocialAuditActivityLog } from '@/types/socialAudit';

export const INITIAL_ACTIVITY_LOGS: SocialAuditActivityLog[] = [
  {
    id: 'act-init-1',
    module: 'system',
    recordId: 'baghpat-2026-27',
    gpName: 'सम्पूर्ण जनपद बागपत',
    block: 'Baghpat',
    actionType: 'create',
    actionLabel: 'वार्षिक रोस्टर सृजन',
    userName: 'प्रशासनिक अधिकारी (DDO)',
    timestamp: '2026-09-01T10:00:00.000Z',
    details: 'वित्तीय वर्ष 2026-27 हेतु जनपद बागपत की 88 ग्राम पंचायतों का सोशल ऑडिट रोस्टर स्वीकृत एवं अपलोड किया गया।'
  },
  {
    id: 'act-init-2',
    module: 'meeting',
    recordId: 'baghpat-sansodhan',
    gpName: '10 संशोधित ग्राम पंचायतें',
    block: 'Baghpat',
    actionType: 'status_change',
    actionLabel: 'रोस्टर संशोधन',
    userName: 'नोडल अधिकारी (सोशल ऑडिट)',
    timestamp: '2026-09-15T11:30:00.000Z',
    details: 'BRP (हरिकिशन) के कार्यमुक्त होने के कारण बागपत की 4 व बड़ौत की 6 कुल 10 ग्राम पंचायतों की बैठक तिथियां व BRP संशोधित किए गए।'
  },
  {
    id: 'act-init-3',
    module: 'nirnay',
    recordId: 'nirnay-sync-initial',
    gpName: '14 ग्राम पंचायतें (R 9.6.2)',
    block: 'Baghpat',
    actionType: 'sync',
    actionLabel: 'पंचायत निर्णय सिंक',
    userName: 'पंचायत निर्णय पोर्टल सिंक',
    timestamp: '2026-10-15T14:20:00.000Z',
    details: 'सरकारी पंचायत निर्णय पोर्टल R 9.6.2 से 14 ग्राम पंचायतों (बागपत 8, बड़ौत 6) की बैठक कार्यवाही सफलतापूर्वक अपलोड पाई गई।'
  },
  {
    id: 'act-init-4',
    module: 'mis',
    recordId: 'mis-sync-initial',
    gpName: '44 ग्राम पंचायतें (R 9.1.3)',
    block: 'Baghpat',
    actionType: 'sync',
    actionLabel: 'MIS फीडिंग सिंक',
    userName: 'MIS R 9.1.3 पोर्टल सिंक',
    timestamp: '2026-10-25T16:45:00.000Z',
    details: 'R 9.1.3 सोशल ऑडिट कैलेंडर रिपोर्ट के सापेक्ष सम्पन्न 52 में से कुल 44 ग्राम पंचायतों (बागपत 26, बड़ौत 18) का डेटा पोर्टल पर फीडेड सत्यापित हुआ।'
  },
  {
    id: 'act-init-5',
    module: 'nsap',
    recordId: 'nsap-init-1',
    gpName: '16 ग्राम पंचायतें (2,234 लाभार्थी)',
    block: 'Baghpat',
    actionType: 'create',
    actionLabel: 'NSAP पेंशन डेटा प्रविष्टि',
    userName: 'NSAP सत्यापन टीम',
    timestamp: '2026-10-28T09:15:00.000Z',
    details: 'राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP) अंतर्गत 16 ग्राम पंचायतों के कुल 2,234 पेंशन लाभार्थियों का भौतिक सत्यापन रजिस्टर दर्ज किया गया।'
  }
];

