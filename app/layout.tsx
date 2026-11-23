import type { Metadata, Viewport } from 'next';
import { Literata, Poppins } from 'next/font/google';
import { site } from './content';
import './globals.css';

// self-hosted at build time: no request to Google from the visitor, and no layout shift on swap
const literata = Literata({ subsets: ['latin'], weight: ['500'], variable: '--font-display', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: '%s | Checko' },
  description: site.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', url: '/', siteName: 'Checko', title: site.title, description: site.description, locale: 'en_IN',
    images: [{ url: '/assets/og.jpg', width: 1200, height: 630, alt: 'Checko: Scan it. Know it’s genuine.' }],
  },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description, images: ['/assets/og.jpg'] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 };

// Runs before first paint, so scroll-reveal sections (data-rv) start hidden only when JS can animate them in.
const jsScript = `try{document.documentElement.classList.add('js')}catch(e){}`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Checko',
  url: site.url,
  logo: `${site.url}/assets/checko.png`,
  slogan: site.tagline,
  description: site.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${literata.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
