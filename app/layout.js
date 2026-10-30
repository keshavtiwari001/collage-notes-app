import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider }  from '@/context/AuthContext';

export const metadata = {
  title: {
    default:  'Academica — Study Notes',
    template: '%s · Academica',
  },
  description: 'Organize your academic notes by semester, subject, chapter, and topic. A modern study knowledge base for students.',
  keywords:    ['study notes', 'academic notes', 'note taking', 'student', 'knowledge base'],
  authors:     [{ name: 'Academica' }],
  openGraph: {
    title:       'Academica — Study Notes',
    description: 'Organize your academic notes by semester, subject, chapter, and topic.',
    type:        'website',
    locale:      'en_US',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
