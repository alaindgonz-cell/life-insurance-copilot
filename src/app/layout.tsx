import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/ui/Providers';

export const metadata: Metadata = {
  title: 'Life Insurance Copilot',
  description: 'Real-time AI copilot for life insurance sales calls',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
