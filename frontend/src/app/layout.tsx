import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Runly.dev — Run Code in 9 Languages Instantly',
  description: 'A blazing-fast online code editor and execution sandbox. Write, compile, and run code in Python, Node.js, C, C++, Java, Go, Rust, PHP, and Ruby — all in your browser.',
  keywords: ['online compiler', 'code editor', 'run code online', 'python', 'javascript', 'rust', 'go'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
