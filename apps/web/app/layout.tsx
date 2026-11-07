import type { Metadata, Viewport } from 'next';
import { lightTheme, darkTheme, themeToCssVars } from '@nexuse/tokens';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OfflineBanner from '@/components/OfflineBanner';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'NEXUSE GO — second-hand study items', template: '%s · NEXUSE GO' },
  description: 'Buy and sell used textbooks, notes, calculators and study gear.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: lightTheme.primary };

const css = `:root{${themeToCssVars(lightTheme)}color-scheme:light}@media(prefers-color-scheme:dark){:root{${themeToCssVars(darkTheme)}color-scheme:dark}}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head><style dangerouslySetInnerHTML={{ __html: css }} /></head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <OfflineBanner />
        <Header />
        <main id="main" tabIndex={-1}><div className="container">{children}</div></main>
        <Footer />
      </body>
    </html>
  );
}
