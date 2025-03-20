import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Layout from './components/layout/Layout';
import { UserProvider } from './context/UserContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ani-Sage - Psychological Anime Recommendation System',
  description: 'Get personalized anime recommendations based on your psychological profile',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <Layout>{children}</Layout>
        </UserProvider>
      </body>
    </html>
  );
}
