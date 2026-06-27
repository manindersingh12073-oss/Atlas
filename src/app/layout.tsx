import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"


export const metadata: Metadata = {
  title: "Atlas",
  description: "The memory layer for your professional relationships.",
};

// Runs synchronously before React hydration to prevent a flash of the wrong
// theme. Reads atlas_theme from localStorage; falls back to system preference.
const THEME_SCRIPT = `(function(){
  try {
    var t = localStorage.getItem('atlas_theme') || 'system';
    var dark = t === 'dark' ||
      (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch(e) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the .dark class is set client-side by ThemeScript
    // before hydration, so server/client HTML will differ. This suppresses the warning.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased dark:bg-[#0f1117] dark:text-[#e6edf3]">
        <ThemeProvider>{children}</ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </body>
    </html>
  );
}
