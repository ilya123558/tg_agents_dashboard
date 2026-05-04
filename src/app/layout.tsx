import type { Metadata } from 'next';
import { Providers } from '@/views/providers';
import { Sidebar } from '@/widgets/Sidebar';
import { BottomNav } from '@/widgets/BottomNav';
import '@/views/styles';

export const metadata: Metadata = {
  title: 'TG Agents Dashboard',
  description: 'CRM для лидов из Telegram',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-[#0f0f0f] text-white">
        <Providers>
<div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
              {children}
            </div>
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
