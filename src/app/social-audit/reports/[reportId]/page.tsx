import { notFound } from 'next/navigation';
import ReportWorkspace from '@/components/socialAudit/ReportWorkspace';
import { REPORT_CATALOG } from '@/lib/socialAuditReports';

export async function generateMetadata({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = REPORT_CATALOG.find(item => item.id === reportId);
  return { title: `${report?.title || 'रिपोर्ट नहीं मिली'} | सोशल ऑडिट बागपत` };
}

export default async function ReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = REPORT_CATALOG.find(item => item.id === reportId);
  if (!report) notFound();
  return <ReportWorkspace reportId={report.id} />;
}
