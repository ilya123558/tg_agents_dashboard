import type { Metadata } from 'next';
import { Providers } from '@/views/providers';
import { AppShell } from '@/widgets/AppShell';
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
          <AppShell>{children}</AppShell>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
