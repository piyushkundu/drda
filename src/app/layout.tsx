import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "पेज हिंदी - AI-Powered Government Hindi Drafting Suite",
  description: "AI-powered Hindi Government Office Drafting Application for DRDA, Social Audit, Nagar Palika, Panchayat, Block Office, Tehsil, IGRS and Rural Development departments",
  keywords: "Hindi typing, government drafting, Kruti Dev, Unicode Hindi, DRDA, Panchayat, AI drafting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" className="h-full" suppressHydrationWarning>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
