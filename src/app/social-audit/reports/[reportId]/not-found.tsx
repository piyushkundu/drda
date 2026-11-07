import Link from 'next/link';

export default function ReportNotFound() {
  return <main className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-100 p-6 text-center"><h1 className="text-xl font-black text-slate-900">यह रिपोर्ट नहीं मिली</h1><p className="text-sm text-slate-500">रिपोर्ट सेंटर से उपलब्ध रिपोर्ट चुनें।</p><Link href="/social-audit/reports" className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white">रिपोर्ट सेंटर खोलें</Link></main>;
}
