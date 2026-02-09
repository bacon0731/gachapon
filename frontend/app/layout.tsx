
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileTabbar from '@/components/MobileTabbar';
import FloatingCheckIn from '@/components/FloatingCheckIn';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AlertProvider } from '@/components/ui/AlertDialog';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: '一番賞線上抽獎',
  description: '隨時隨地，享受抽獎樂趣',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen flex flex-col font-sans text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-50 transition-colors duration-300">
        <AuthProvider>
          <ThemeProvider>
            <AlertProvider>
              <ToastProvider>
                <Navbar />
                <main className="flex-grow">{children}</main>
                <div className="hidden md:block">
                  <FloatingCheckIn />
                </div>
                <div className="hidden md:block">
                  <Footer />
                </div>
                <MobileTabbar />
              </ToastProvider>
            </AlertProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
