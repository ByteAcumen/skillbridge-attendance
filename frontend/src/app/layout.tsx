import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { SiteHeader } from '@/components/site/site-header'
import './globals.css'

export const metadata: Metadata = {
  title: 'SkillBridge Attendance',
  description: 'Role-based attendance management for skilling programmes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <ClerkProvider>
          <SiteHeader />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
